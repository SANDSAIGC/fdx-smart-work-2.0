# ---------------------------------------------------------------------------------------------
#   Copyright (c) Microsoft Corporation. All rights reserved.
#   Licensed under the MIT License. See License.txt in the project root for license information.
# ---------------------------------------------------------------------------------------------

# Prevent installing more than once per session
if (Test-Path variable:global:__VSCodeState.OriginalPrompt) {
	return;
}

# Disable shell integration when the language mode is restricted
if ($ExecutionContext.SessionState.LanguageMode -ne "FullLanguage") {
	return;
}

$Global:__VSCodeState = @{
	OriginalPrompt = $function:Prompt
	LastHistoryId = -1
	IsInExecution = $false
	EnvVarsToReport = @()
	Nonce = $null
	IsStable = $null
	IsWindows10 = $false
}

# Store the nonce in a regular variable and unset the environment variable. It's by design that
# anything that can execute PowerShell code can read the nonce, as it's basically impossible to hide
# in PowerShell. The most important thing is getting it out of the environment.
$Global:__VSCodeState.Nonce = $env:VSCODE_NONCE
$env:VSCODE_NONCE = $null

$Global:__VSCodeState.IsStable = $env:VSCODE_STABLE
$env:VSCODE_STABLE = $null

$__vscode_shell_env_reporting = $env:VSCODE_SHELL_ENV_REPORTING
$env:VSCODE_SHELL_ENV_REPORTING = $null
if ($__vscode_shell_env_reporting) {
	$Global:__VSCodeState.EnvVarsToReport = $__vscode_shell_env_reporting.Split(',')
}
Remove-Variable -Name __vscode_shell_env_reporting -ErrorAction SilentlyContinue

$osVersion = [System.Environment]::OSVersion.Version
$Global:__VSCodeState.IsWindows10 = $IsWindows -and $osVersion.Major -eq 10 -and $osVersion.Minor -eq 0 -and $osVersion.Build -lt 22000
Remove-Variable -Name osVersion -ErrorAction SilentlyContinue

if ($env:VSCODE_ENV_REPLACE) {
	$Split = $env:VSCODE_ENV_REPLACE.Split(":")
	foreach ($Item in $Split) {
		$Inner = $Item.Split('=', 2)
		[Environment]::SetEnvironmentVariable($Inner[0], $Inner[1].Replace('\x3a', ':'))
	}
	$env:VSCODE_ENV_REPLACE = $null
}
if ($env:VSCODE_ENV_PREPEND) {
	$Split = $env:VSCODE_ENV_PREPEND.Split(":")
	foreach ($Item in $Split) {
		$Inner = $Item.Split('=', 2)
		[Environment]::SetEnvironmentVariable($Inner[0], $Inner[1].Replace('\x3a', ':') + [Environment]::GetEnvironmentVariable($Inner[0]))
	}
	$env:VSCODE_ENV_PREPEND = $null
}
if ($env:VSCODE_ENV_APPEND) {
	$Split = $env:VSCODE_ENV_APPEND.Split(":")
	foreach ($Item in $Split) {
		$Inner = $Item.Split('=', 2)
		[Environment]::SetEnvironmentVariable($Inner[0], [Environment]::GetEnvironmentVariable($Inner[0]) + $Inner[1].Replace('\x3a', ':'))
	}
	$env:VSCODE_ENV_APPEND = $null
}

function Global:__VSCode-Escape-Value([string]$value) {
	# NOTE: In PowerShell v6.1+, this can be written `$value -replace '…', { … }` instead of `[regex]::Replace`.
	# Replace any non-alphanumeric characters.
	[regex]::Replace($value, "[$([char]0x00)-$([char]0x1f)\\\n;]", { param($match)
			# Encode the (ascii) matches as `\x<hex>`
			-Join (
				[System.Text.Encoding]::UTF8.GetBytes($match.Value) | ForEach-Object { '\x{0:x2}' -f $_ }
			)
		})
}

function Global:Prompt() {
	$FakeCode = [int]!$global:?
	# NOTE: We disable strict mode for the scope of this function because it unhelpfully throws an
	# error when $LastHistoryEntry is null, and is not otherwise useful.
	Set-StrictMode -Off
	$LastHistoryEntry = Get-History -Count 1
	$Result = ""
	# Skip finishing the command if the first command has not yet started or an execution has not
	# yet begun
	if ($Global:__VSCodeState.LastHistoryId -ne -1 -and $Global:__VSCodeState.IsInExecution -eq $true) {
		$Global:__VSCodeState.IsInExecution = $false
		if ($LastHistoryEntry.Id -eq $Global:__VSCodeState.LastHistoryId) {
			# Don't provide a command line or exit code if there was no history entry (eg. ctrl+c, enter on no command)
			$Result += "$([char]0x1b)]633;D`a"
		}
		else {
			# Command finished exit code
			# OSC 633 ; D [; <ExitCode>] ST
			$Result += "$([char]0x1b)]633;D;$FakeCode`a"
		}
	}
	# Prompt started
	# OSC 633 ; A ST
	$Result += "$([char]0x1b)]633;A`a"
	# Current working directory
	# OSC 633 ; <Property>=<Value> ST
	$Result += if ($pwd.Provider.Name -eq 'FileSystem') { "$([char]0x1b)]633;P;Cwd=$(__VSCode-Escape-Value $pwd.ProviderPath)`a" }

	# Send current environment variables as JSON
	# OSC 633 ; EnvJson ; <Environment> ; <Nonce>
	if ($Global:__VSCodeState.EnvVarsToReport.Count -gt 0) {
		$envMap = @{}
        foreach ($varName in $Global:__VSCodeState.EnvVarsToReport) {
            if (Test-Path "env:$varName") {
                $envMap[$varName] = (Get-Item "env:$varName").Value
            }
        }
        $envJson = $envMap | ConvertTo-Json -Compress
        $Result += "$([char]0x1b)]633;EnvJson;$(__VSCode-Escape-Value $envJson);$($Global:__VSCodeState.Nonce)`a"
	}

	# Before running the original prompt, put $? back to what it was:
	if ($FakeCode -ne 0) {
		Write-Error "failure" -ea ignore
	}
	# Run the original prompt
	$OriginalPrompt += $Global:__VSCodeState.OriginalPrompt.Invoke()
	$Result += $OriginalPrompt

	# Prompt
	# OSC 633 ; <Property>=<Value> ST
	if ($Global:__VSCodeState.IsStable -eq "0") {
		$Result += "$([char]0x1b)]633;P;Prompt=$(__VSCode-Escape-Value $OriginalPrompt)`a"
	}

	# Write command started
	$Result += "$([char]0x1b)]633;B`a"
	$Global:__VSCodeState.LastHistoryId = $LastHistoryEntry.Id
	return $Result
}

# Report prompt type
if ($env:STARSHIP_SESSION_KEY) {
	[Console]::Write("$([char]0x1b)]633;P;PromptType=starship`a")
}
elseif ($env:POSH_SESSION_ID) {
	[Console]::Write("$([char]0x1b)]633;P;PromptType=oh-my-posh`a")
}
elseif ((Test-Path variable:global:GitPromptSettings) -and $Global:GitPromptSettings) {
	[Console]::Write("$([char]0x1b)]633;P;PromptType=posh-git`a")
}

# Only send the command executed sequence when PSReadLine is loaded, if not shell integration should
# still work thanks to the command line sequence
if (Get-Module -Name PSReadLine) {
	[Console]::Write("$([char]0x1b)]633;P;HasRichCommandDetection=True`a")

	$Global:__VSCodeState.OriginalPSConsoleHostReadLine = $function:PSConsoleHostReadLine
	function Global:PSConsoleHostReadLine {
		$CommandLine = $Global:__VSCodeState.OriginalPSConsoleHostReadLine.Invoke()
		$Global:__VSCodeState.IsInExecution = $true

		# Command line
		# OSC 633 ; E [; <CommandLine> [; <Nonce>]] ST
		$Result = "$([char]0x1b)]633;E;"
		$Result += $(__VSCode-Escape-Value $CommandLine)
		# Only send the nonce if the OS is not Windows 10 as it seems to echo to the terminal
		# sometimes
		if ($Global:__VSCodeState.IsWindows10 -eq $false) {
			$Result += ";$($Global:__VSCodeState.Nonce)"
		}
		$Result += "`a"

		# Command executed
		# OSC 633 ; C ST
		$Result += "$([char]0x1b)]633;C`a"

		# Write command executed sequence directly to Console to avoid the new line from Write-Host
		[Console]::Write($Result)

		$CommandLine
	}

	# Set ContinuationPrompt property
	$Global:__VSCodeState.ContinuationPrompt = (Get-PSReadLineOption).ContinuationPrompt
	if ($Global:__VSCodeState.ContinuationPrompt) {
		[Console]::Write("$([char]0x1b)]633;P;ContinuationPrompt=$(__VSCode-Escape-Value $Global:__VSCodeState.ContinuationPrompt)`a")
	}
}

# Set IsWindows property
if ($PSVersionTable.PSVersion -lt "6.0") {
	# Windows PowerShell is only available on Windows
	[Console]::Write("$([char]0x1b)]633;P;IsWindows=$true`a")
}
else {
	[Console]::Write("$([char]0x1b)]633;P;IsWindows=$IsWindows`a")
}

# Set always on key handlers which map to default VS Code keybindings
function Set-MappedKeyHandler {
	param ([string[]] $Chord, [string[]]$Sequence)
	try {
		$Handler = Get-PSReadLineKeyHandler -Chord $Chord | Select-Object -First 1
	}
 catch [System.Management.Automation.ParameterBindingException] {
		# PowerShell 5.1 ships with PSReadLine 2.0.0 which does not have -Chord,
		# so we check what's bound and filter it.
		$Handler = Get-PSReadLineKeyHandler -Bound | Where-Object -FilterScript { $_.Key -eq $Chord } | Select-Object -First 1
	}
	if ($Handler) {
		Set-PSReadLineKeyHandler -Chord $Sequence -Function $Handler.Function
	}
}

function Set-MappedKeyHandlers {
	Set-MappedKeyHandler -Chord Ctrl+Spacebar -Sequence 'F12,a'
	Set-MappedKeyHandler -Chord Alt+Spacebar -Sequence 'F12,b'
	Set-MappedKeyHandler -Chord Shift+Enter -Sequence 'F12,c'
	Set-MappedKeyHandler -Chord Shift+End -Sequence 'F12,d'

	# Enable suggestions if the environment variable is set and Windows PowerShell is not being used
	# as APIs are not available to support this feature
	if ($env:VSCODE_SUGGEST -eq '1' -and $PSVersionTable.PSVersion -ge "7.0") {
		Remove-Item Env:VSCODE_SUGGEST

		# VS Code send completions request (may override Ctrl+Spacebar)
		Set-PSReadLineKeyHandler -Chord 'F12,e' -ScriptBlock {
			Send-Completions
		}
	}
}

function Send-Completions {
	$commandLine = ""
	$cursorIndex = 0
	$prefixCursorDelta = 0
	[Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$commandLine, [ref]$cursorIndex)
	$completionPrefix = $commandLine

	# Start completions sequence
	$result = "$([char]0x1b)]633;Completions"

	# Only provide completions for arguments and defer to TabExpansion2.
	# `[` is included here as namespace commands are not included in CompleteCommand(''),
	# additionally for some reason CompleteVariable('[') causes the prompt to clear and reprint
	# multiple times
	if ($completionPrefix.Contains(' ')) {

		# Adjust the completion prefix and cursor index such that tab expansion will be requested
		# immediately after the last whitespace. This allows the client to perform fuzzy filtering
		# such that requesting completions in the middle of a word should show the same completions
		# as at the start. This only happens when the last word does not include special characters:
		# - `-`: Completion change when flags are used.
		# - `/` and `\`: Completions change when navigating directories.
		# - `$`: Completions change when variables.
		$lastWhitespaceIndex = $completionPrefix.LastIndexOf(' ')
		$lastWord = $completionPrefix.Substring($lastWhitespaceIndex + 1)
		if ($lastWord -match '^-') {
			$newCursorIndex = $lastWhitespaceIndex + 2
			$completionPrefix = $completionPrefix.Substring(0, $newCursorIndex)
			$prefixCursorDelta = $cursorIndex - $newCursorIndex
			$cursorIndex = $newCursorIndex
		}
		elseif ($lastWord -notmatch '[/\\$]') {
			if ($lastWhitespaceIndex -ne -1 -and $lastWhitespaceIndex -lt $cursorIndex) {
				$newCursorIndex = $lastWhitespaceIndex + 1
				$completionPrefix = $completionPrefix.Substring(0, $newCursorIndex)
				$prefixCursorDelta = $cursorIndex - $newCursorIndex
				$cursorIndex = $newCursorIndex
			}
		}
		# If it contains `/` or `\`, get completions from the nearest `/` or `\` such that file
		# completions are consistent regardless of where it was requested
		elseif ($lastWord -match '[/\\]') {
			$lastSlashIndex = $completionPrefix.LastIndexOfAny(@('/', '\'))
			if ($lastSlashIndex -ne -1 -and $lastSlashIndex -lt $cursorIndex) {
				$newCursorIndex = $lastSlashIndex + 1
				$completionPrefix = $completionPrefix.Substring(0, $newCursorIndex)
				$prefixCursorDelta = $cursorIndex - $newCursorIndex
				$cursorIndex = $newCursorIndex
			}
		}

		# Get completions using TabExpansion2
		$completions = $null
		$completionMatches = $null
		try
		{
			$completions = TabExpansion2 -inputScript $completionPrefix -cursorColumn $cursorIndex
			$completionMatches = $completions.CompletionMatches | Where-Object { $_.ResultType -ne [System.Management.Automation.CompletionResultType]::ProviderContainer -and $_.ResultType -ne [System.Management.Automation.CompletionResultType]::ProviderItem }
		}
		catch
		{
			# TabExpansion2 may throw when there are no completions, in this case return an empty
			# list to prevent falling back to file path completions
		}
		if ($null -eq $completions -or $null -eq $completionMatches) {
			$result += ";0;$($completionPrefix.Length);$($completionPrefix.Length);[]"
		} else {
			$result += ";$($completions.ReplacementIndex);$($completions.ReplacementLength + $prefixCursorDelta);$($cursorIndex - $prefixCursorDelta);"
			$json = [System.Collections.ArrayList]@($completionMatches)
			$mappedCommands = Compress-Completions($json)
			$result += $mappedCommands | ConvertTo-Json -Compress
		}
	}

	# End completions sequence
	$result += "`a"

	Write-Host -NoNewLine $result
}

function Compress-Completions($completions) {
	$completions | ForEach-Object {
		if ($_.CustomIcon) {
			,@($_.CompletionText, $_.ResultType, $_.ToolTip, $_.CustomIcon)
		}
		elseif ($_.CompletionText -eq $_.ToolTip) {
			,@($_.CompletionText, $_.ResultType)
		} else {
			,@($_.CompletionText, $_.ResultType, $_.ToolTip)
		}
	}
}

# Register key handlers if PSReadLine is available
if (Get-Module -Name PSReadLine) {
	Set-MappedKeyHandlers
}

# SIG # Begin signature block
# MIIu8wYJKoZIhvcNAQcCoIIu5DCCLuACAQExDzANBglghkgBZQMEAgEFADB5Bgor
# BgEEAYI3AgEEoGswaTA0BgorBgEEAYI3AgEeMCYCAwEAAAQQH8w7YFlLCE63JNLG
# KX7zUQIBAAIBAAIBAAIBAAIBADAxMA0GCWCGSAFlAwQCAQUABCDmWPfNhpZpdLbY
# /dQWJF4CWi+Vy48/NtsRlWeeJ+4C2aCCFBcwggYxMIIEGaADAgECAhMzAAAANmAe
# ZqswxBCVAAEAAAA2MA0GCSqGSIb3DQEBCwUAMIGHMQswCQYDVQQGEwJVUzETMBEG
# A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
# cm9zb2Z0IENvcnBvcmF0aW9uMTEwLwYDVQQDEyhNaWNyb3NvZnQgTWFya2V0cGxh
# Y2UgUHJvZHVjdGlvbiBDQSAyMDExMB4XDTI0MDkxMjE5Mzc0NFoXDTI1MDkxMTE5
# Mzc0NFowdDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNV
# BAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEeMBwG
# A1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMIIBIjANBgkqhkiG9w0BAQEFAAOC
# AQ8AMIIBCgKCAQEAzAPSoncI7hsl9rL6bGOWJHhcxEKyMydh79FADmKfND5RpDbG
# UwlNtJO+qsC4fMC/mPNtbM3nf2nsWkZ/R8UzVY9htGfsYHcLiWHpfHw1TLHC6uYg
# 1NDeb3L9PJafRn0IPuKHBVqDgBdVD8gKHZEIthlnpDp0pVAkbfRoebyqYDHcoPe4
# vOWocog/CN51IrmoosT1cfCyPhYR4iAPbp6KEGPY8FUkuwPFr9GnWy602Kpxj7me
# 35RujkUhphS32eqv25w6SDrOR2OkE5Cx2omVxqr5IMvdQHH1Yf6azVUPTTpfAQEq
# OvjUbaWGvWbr1Kpbb6y4+RegbRMNX/h/boSIzQIDAQABo4IBpjCCAaIwEwYDVR0l
# BAwwCgYIKwYBBQUHAwMwHQYDVR0OBBYEFNS+PJeclrQDoC7URLX1iaIHSglhMFQG
# A1UdEQRNMEukSTBHMS0wKwYDVQQLEyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRp
# b25zIExpbWl0ZWQxFjAUBgNVBAUTDTIyOTk3OSs1MDI5MzUwHwYDVR0jBBgwFoAU
# nqf5oCNwnxHFaeOhjQr68bD01YAwbAYDVR0fBGUwYzBhoF+gXYZbaHR0cDovL3d3
# dy5taWNyb3NvZnQuY29tL3BraW9wcy9jcmwvTWljcm9zb2Z0JTIwTWFya2V0cGxh
# Y2UlMjBQcm9kdWN0aW9uJTIwQ0ElMjAyMDExKDEpLmNybDB5BggrBgEFBQcBAQRt
# MGswaQYIKwYBBQUHMAKGXWh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMv
# Y2VydHMvTWljcm9zb2Z0JTIwTWFya2V0cGxhY2UlMjBQcm9kdWN0aW9uJTIwQ0El
# MjAyMDExKDEpLmNydDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4ICAQAT
# r8Erzm//Pn9Cec3FjGDHzoHtwDvZjb6KLtmTBw+Zi5CZJZ8+Q+zPmhgJ8ZYFMn0b
# BhM7cUapctWpfe5/fl207cWFCmxnIrlkIO1NY5OETQygPXP+U15iNB0qzHTjIQmZ
# fh+KW5+YCTcwIQ5Zak1Oi62YHzpKqQp4g/z4xG0UV2nxUiPcdu7FB+iKDAahtW/1
# /f5+jZrtt/oaaXxL37MErxZqFAKfinVlj2E6ZoQMn/B/0Q+YJC2GFKNLXFTPcquU
# qGKcuUaOBb4rVGtSQOVymgjGuavgzWDwfl6eGlVO5w4jfsHI0KE8eQo1TsKIoBd9
# T8CwqKZAuzoY3uqLm3bBdXC2YSsHWiQbDrjFSEnHulV3dokejSBxtGXVXOoD+GKS
# fJZapbWvIkjYA9/tU9iDWwoKG5U1/PiUnWmpVjxBbqDGjwTherCVbBiZcn0l4ydF
# ZGUkp7PwBzLjW4Yw3cTbIb6SUvt9enAE6zG+0U6ftpY+e6kAI4t7T5i7YpgV41xv
# WbgPI8KaSIdmAbI0UKNbYJi/ZowSv3fo5r1+LSbdH7Wr0LjWqz1r84CAmMlUTlYV
# ZaZLecL44RN98hiRjcFNYu4NUeWbLTFXvAjKGRi1pAsqNML7tyscHz+z8oaxkACu
# B0eI3TYD7yYals+TfHUzVxCeXg7tY3YhfXzgpB+COTCCBtcwggS/oAMCAQICCmES
# RKIAAAAAAAIwDQYJKoZIhvcNAQELBQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
# EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
# ZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMTKU1pY3Jvc29mdCBSb290IENlcnRpZmlj
# YXRlIEF1dGhvcml0eSAyMDExMB4XDTExMDMyODIxMDkzOVoXDTMxMDMyODIxMTkz
# OVowfTELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
# B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEnMCUGA1UE
# AxMeTWljcm9zb2Z0IE1hcmtldFBsYWNlIFBDQSAyMDExMIICIjANBgkqhkiG9w0B
# AQEFAAOCAg8AMIICCgKCAgEAubUaSwGYVsE3MAnPfvmozUhAB3qxBABgJRW1vDp4
# +tVinXxD32f7k1K89JQ6zDOgS/iDgULC+yFK1K/1Qjac/0M7P6c8v5LSjnWGlERL
# a/qY32j46S7SLQcit3g2jgoTTO03eUG+9yHZUTGV/FJdRYB8uXhrznJBa+Y+yGwi
# QKF+m6XFeBH/KORoKFx+dmMoy9EWJ/m/o9IiUj2kzm9C691+vZ/I2w0Bj93W9SPP
# kV2PCNHlzgfIAoeajWpHmi38Wi3xZHonkzAVBHxPsCBppOoNsWvmAfUM7eBthkSP
# vFruekyDCPNEYhfGqgqtqLkoBebXLZCOVybF7wTQaLvse60//3P003icRcCoQYgY
# 4NAqrF7j80o5U7DkeXxcB0xvengsaKgiAaV1DKkRbpe98wCqr1AASvm5rAJUYMU+
# mXmOieV2EelY2jGrenWe9FQpNXYV1NoWBh0WKoFxttoWYAnF705bIWtSZsz08ZfK
# 6WLX4GXNLcPBlgCzfTm1sdKYASWdBbH2haaNhPapFhQQBJHKwnVW2iXErImhuPi4
# 5W3MVTZ5D9ASshZx69cLYY6xAdIa+89Kf/uRrsGOVZfahDuDw+NI183iAyzC8z/Q
# Rt2P32LYxP0xrCdqVh+DJo2i4NoE8Uk1usCdbVRuBMBQl/AwpOTq7IMvHGElf65C
# qzUCAwEAAaOCAUswggFHMBAGCSsGAQQBgjcVAQQDAgEAMB0GA1UdDgQWBBQPU8s/
# FmEl/mCJHdO5fOiQrbOU0TAZBgkrBgEEAYI3FAIEDB4KAFMAdQBiAEMAQTALBgNV
# HQ8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAfBgNVHSMEGDAWgBRyLToCMZBDuRQF
# TuHqp8cx0SOJNDBaBgNVHR8EUzBRME+gTaBLhklodHRwOi8vY3JsLm1pY3Jvc29m
# dC5jb20vcGtpL2NybC9wcm9kdWN0cy9NaWNSb29DZXJBdXQyMDExXzIwMTFfMDNf
# MjIuY3JsMF4GCCsGAQUFBwEBBFIwUDBOBggrBgEFBQcwAoZCaHR0cDovL3d3dy5t
# aWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNSb29DZXJBdXQyMDExXzIwMTFfMDNf
# MjIuY3J0MA0GCSqGSIb3DQEBCwUAA4ICAQCjuZmM8ZVNDgp9wHsL4RY8KJ8nLinv
# xFTphNGCrxaLknkYG5pmMhVlX+UB/tSiW8W13W60nggz9u5xwMx7v/1t/Tgm6g2b
# rVyOKI5A7u6/2SIJwkJKFw953K0YIKVT28w9zl8dSJnmRnyR0G86ncWbF6CLQ6A6
# lBQ9o2mTGVqDr4m35WKAnc6YxUUM1y74mbzFFZr63VHsCcOp3pXWnUqAY1rb6Q6N
# X1b3clncKqLFm0EjKHcQ56grTbwuuB7pMdh/IFCJR01MQzQbDtpEisbOeZUi43YV
# AAHKqI1EO9bRwg3frCjwAbml9MmI4utMW94gWFgvrMxIX+n42RBDIjf3Ot3jkT6g
# t3XeTTmO9bptgblZimhERdkFRUFpVtkocJeLoGuuzP93uH/Yp032wzRH+XmMgujf
# Zv+vnfllJqxdowoQLx55FxLLeTeYfwi/xMSjZO2gNven3U/3KeSCd1kUOFS3AOrw
# Z0UNOXJeW5JQC6Vfd1BavFZ6FAta1fMLu3WFvNB+FqeHUaU3ya7rmtxJnzk29DeS
# qXgGNmVSywBS4NajI5jJIKAA6UhNJlsg8CHYwUOKf5ej8OoQCkbadUxXygAfxCfW
# 2YBbujtI+PoyejRFxWUjYFWO5LeTI62UMyqfOEiqugoYjNxmQZla2s4YHVuqIC34
# R85FQlg9pKQBsDCCBwMwggTroAMCAQICEzMAAABVyAZrOCOXKQkAAAAAAFUwDQYJ
# KoZIhvcNAQELBQAwfTELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
# EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
# bjEnMCUGA1UEAxMeTWljcm9zb2Z0IE1hcmtldFBsYWNlIFBDQSAyMDExMB4XDTIx
# MDkwOTIyNDIzMFoXDTMwMDkwOTIyNTIzMFowgYcxCzAJBgNVBAYTAlVTMRMwEQYD
# VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24xMTAvBgNVBAMTKE1pY3Jvc29mdCBNYXJrZXRwbGFj
# ZSBQcm9kdWN0aW9uIENBIDIwMTEwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIK
# AoICAQDHfQ3P+L0El1S6JNYAz70y3e1i7EZAYcCDVXde/nQdpOKtVr6H4QkBkROv
# 7HBxY0U8lR9C3bUUZKn6CCcN3v3bQuYKu1Ff2G4nIIr8a1cB4iOU8i4YSN7bRr+5
# LvD5hyCfJHqXrJe5LRRGjws5aRAxYuGhQ3ypWPEZYfrIXmmYK+e+udApgxahHUPB
# qcbI2PT1PpkKDgqR7hyzW0CfWzRUwh+YoZpsVvDaEkxcHQe/yGJB5BluYyRm5K9z
# +YQqBvYJkNUisTE/9OImnaZqoujkEuhM5bBV/dNjw7YN37OcBuH0NvlQomLQo+V7
# PA519HVVE1kRQ8pFad6i4YdRWpj/+1yFskRZ5m7y+dEdGyXAiFeIgaM6O1CFrA1L
# bMAvyaZpQwBkrT/etC0hw4BPmW70zSmSubMoHpx/UUTNo3fMUVqx6r2H1xsc4aXT
# pPN5IxjkGIQhPN6h3q5JC+JOPnsfDRg3Ive2Q22jj3tkNiOXrYpmkILk7v+4XUxD
# Erdc/WLZ3sbF27hug7HSVbTCNA46scIqE7ZkgH3M7+8aP3iUBDNcYUWjO1u+P1Q6
# UUzFdShSbGbKf+Z3xpqlwdxQq9kuUahACRQLMFjRUfmAqGXUdMXECRaFPTxl6SB/
# 7IAcuK855beqNPcexVEpkSZxZJbnqjKWbyTk/GA1abW8zgfH2QIDAQABo4IBbzCC
# AWswEgYJKwYBBAGCNxUBBAUCAwEAATAjBgkrBgEEAYI3FQIEFgQUeBlfau2VIfkw
# k2K+EoAD6hZ05ccwHQYDVR0OBBYEFJ6n+aAjcJ8RxWnjoY0K+vGw9NWAMBkGCSsG
# AQQBgjcUAgQMHgoAUwB1AGIAQwBBMAsGA1UdDwQEAwIBhjASBgNVHRMBAf8ECDAG
# AQH/AgEAMB8GA1UdIwQYMBaAFA9Tyz8WYSX+YIkd07l86JCts5TRMFcGA1UdHwRQ
# ME4wTKBKoEiGRmh0dHA6Ly9jcmwubWljcm9zb2Z0LmNvbS9wa2kvY3JsL3Byb2R1
# Y3RzL01pY01hclBDQTIwMTFfMjAxMS0wMy0yOC5jcmwwWwYIKwYBBQUHAQEETzBN
# MEsGCCsGAQUFBzAChj9odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpL2NlcnRz
# L01pY01hclBDQTIwMTFfMjAxMS0wMy0yOC5jcnQwDQYJKoZIhvcNAQELBQADggIB
# ACY4RaglNFzKOO+3zgazCsgCvXca79D573wDc0DAj6KzBX9m4rHhAZqzBkfSWvan
# LFilDibWmbGUGbkuH0y29NEoLVHfY64PXmXcBWEWd1xK4QxyKx2VVDq9P9494Z/v
# Xy9OsifTP8Gt2UkhftAQMcvKgGiAHtyRHda8r7oU4cc4ITZnMsgXv6GnMDVuIk+C
# q0Eh93rgzKF2rJ1sJcraH/kgSkgawBYYdJlXXHTkOrfEPKU82BDT5h8SGsXVt5L1
# mwRzjVQRLs1FNPkA+Kqyz0L+UEXJZWldNtHC79XtYh/ysRov4Yu/wLF+c8Pm15IC
# n8EYJUL4ZKmk9ZM7ZcaUV/2XvBpufWE2rcMnS/dPHWIojQ1FTToqM+Ag2jZZ33fl
# 8rJwnnIF/Ku4OZEN24wQLYsOMHh6WKADxkXJhiYUwBe2vCMHDVLpbCY7CbPpQdtB
# YHEkto0MFADdyX50sNVgTKboPyCxPW6GLiR5R+qqzNRzpYru2pTsM6EodSTgcMbe
# aDZI7ssnv+NYMyWstE1IXQCUywLQohNDo6H7/HNwC8HtdsGd5j0j+WOIEO5PyCbj
# n5viNWWCUu7Ko6Qx68NuxHf++swe9YQhufh0hzJnixidTRPkBUgYQ6xubG6I5g/2
# OO1BByOu9/jt5vMTTvctq2YWOhUjoOZPe53eYSzjvNydMYIaMjCCGi4CAQEwgZ8w
# gYcxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdS
# ZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMTAvBgNVBAMT
# KE1pY3Jvc29mdCBNYXJrZXRwbGFjZSBQcm9kdWN0aW9uIENBIDIwMTECEzMAAAA2
# YB5mqzDEEJUAAQAAADYwDQYJYIZIAWUDBAIBBQCggbAwGQYJKoZIhvcNAQkDMQwG
# CisGAQQBgjcCAQQwHAYKKwYBBAGCNwIBCzEOMAwGCisGAQQBgjcCARUwLwYJKoZI
# hvcNAQkEMSIEIKCPsUww0wjpnlz+Qsaxq0WNTONWsJcQ/fiYazVE4c7KMEQGCisG
# AQQBgjcCAQwxNjA0oBCADgBWAFMAIABDAG8AZABloSCAHmh0dHBzOi8vY29kZS52
# aXN1YWxzdHVkaW8uY29tLzANBgkqhkiG9w0BAQEFAASCAQBoe43rwgGmZarWkZit
# pyWwXydg+qmg9P9QpueRSSfk3I1bKMHXKSbdJ2n8tKRZKv7fBEmMajk61Co2Dq60
# Oj5glxm9gW41Ly4uWG+1opV5Wdg7pcXuTqhzCuH1qNzg2EZKoD/VGHbLYSLkiUDp
# W3k+WQC21Nf5KBvFrYPKxDae2TkVvG01pfFZ3e9SQlo2UJbNQZUn+hsT6WCbhQT3
# vIB20GqvwHH1vYTSn0VqV8gv0UPTN8a+uLnKMC5HBiHTeo5FRM4Htw+LQ30b1iNM
# W7Dc3SZwEv/x0yMFW73v5kaAP4DdGZXI7mn/DnP32fnkpfWt3FHgfQ/QEMCAcgCY
# DrPaoYIXsDCCF6wGCisGAQQBgjcDAwExghecMIIXmAYJKoZIhvcNAQcCoIIXiTCC
# F4UCAQMxDzANBglghkgBZQMEAgEFADCCAVoGCyqGSIb3DQEJEAEEoIIBSQSCAUUw
# ggFBAgEBBgorBgEEAYRZCgMBMDEwDQYJYIZIAWUDBAIBBQAEILg2DO3SesnAwHzt
# NVofMocU8NviRD6PJZz8Ni8Mxv73AgZoUq8fSa0YEzIwMjUwNzA5MjIyNjEzLjE5
# MVowBIACAfSggdmkgdYwgdMxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
# dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9y
# YXRpb24xLTArBgNVBAsTJE1pY3Jvc29mdCBJcmVsYW5kIE9wZXJhdGlvbnMgTGlt
# aXRlZDEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOjMyMUEtMDVFMC1EOTQ3MSUw
# IwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNloIIR/jCCBygwggUQ
# oAMCAQICEzMAAAH4o6EmDAxASP4AAQAAAfgwDQYJKoZIhvcNAQELBQAwfDELMAkG
# A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQx
# HjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9z
# b2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwHhcNMjQwNzI1MTgzMTA4WhcNMjUxMDIy
# MTgzMTA4WjCB0zELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
# BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEt
# MCsGA1UECxMkTWljcm9zb2Z0IElyZWxhbmQgT3BlcmF0aW9ucyBMaW1pdGVkMScw
# JQYDVQQLEx5uU2hpZWxkIFRTUyBFU046MzIxQS0wNUUwLUQ5NDcxJTAjBgNVBAMT
# HE1pY3Jvc29mdCBUaW1lLVN0YW1wIFNlcnZpY2UwggIiMA0GCSqGSIb3DQEBAQUA
# A4ICDwAwggIKAoICAQDFHbeldicPYG44N15ezYK79PmQoj5sDDxxu03nQKb8UCuN
# fIvhFOox7qVpD8Kp4xPGByS9mvUmtbQyLgXXmvH9W94aEoGahvjkOY5xXnHLHuH1
# OTn00CXk80wBYoAhZ/bvRJYABbFBulUiGE9YKdVXei1W9qERp3ykyahJetPlns2T
# VGcHvQDZur0eTzAh4Le8G7ERfYTxfnQiAAezJpH2ugWrcSvNQQeVLxidKrfe6Lm4
# FysU5wU4Jkgu5UVVOASpKtfhSJfR62qLuNS0rKmAh+VplxXlwjlcj94LFjzAM2YG
# muFgw2VjF2ZD1otENxMpa111amcm3KXl7eAe5iiPzG4NDRdk3LsRJHAkgrTf6tNm
# p9pjIzhdIrWzRpr6Y7r2+j82YnhH9/X4q5wE8njJR1uolYzfEy8HAtjJy+KAj9Yr
# iSA+iDRQE1zNpDANVelxT5Mxw69Y/wcFaZYlAiZNkicAWK9epRoFujfAB881uxCm
# 800a7/XamDQXw78J1F+A8d86EhZDQPwAsJj4uyLBvNx6NutWXg31+fbA6DawNrxF
# 82gPrXgjSkWPL+WrU2wGj1XgZkGKTNftmNYJGB3UUIFcal+kOKQeNDTlg6QBqR1Y
# NPZsZJpRkkZVi16kik9MCzWB3+9SiBx2IvnWjuyG4ciUHpBJSJDbhdiFFttAIQID
# AQABo4IBSTCCAUUwHQYDVR0OBBYEFL3OxnPPntCVPmeu3+iK0u/U5Du2MB8GA1Ud
# IwQYMBaAFJ+nFV0AXmJdg/Tl0mWnG1M1GelyMF8GA1UdHwRYMFYwVKBSoFCGTmh0
# dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY3JsL01pY3Jvc29mdCUyMFRp
# bWUtU3RhbXAlMjBQQ0ElMjAyMDEwKDEpLmNybDBsBggrBgEFBQcBAQRgMF4wXAYI
# KwYBBQUHMAKGUGh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY2VydHMv
# TWljcm9zb2Z0JTIwVGltZS1TdGFtcCUyMFBDQSUyMDIwMTAoMSkuY3J0MAwGA1Ud
# EwEB/wQCMAAwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwgwDgYDVR0PAQH/BAQDAgeA
# MA0GCSqGSIb3DQEBCwUAA4ICAQBh+TwbPOkRWcaXvLqhejK0JvjYfHpM4DT52RoE
# jfp+0MT20u5tRr/ExscHmtw2JGEUdn3dF590+lzj4UXQMCXmU/zEoA77b3dFY8oM
# U4UjGC1ljTy3wP1xJCmAZTPLDeURNl5s0sQDXsD8JOkDYX26HyPzgrKB4RuP5uJ1
# YOIR9rKgfYDn/nLAknEi4vMVUdpy9bFIIqgX2GVKtlIbl9dZLedqZ/i23r3RRPoA
# bJYsVZ7z3lygU/Gb+bRQgyOOn1VEUfudvc2DZDiA9L0TllMxnqcCWZSJwOPQ1cCz
# bBC5CudidtEAn8NBbfmoujsNrD0Cwi2qMWFsxwbryANziPvgvYph7/aCgEcvDNKf
# lQN+1LUdkjRlGyqY0cjRNm+9RZf1qObpJ8sFMS2hOjqAs5fRQP/2uuEaN2SILDhL
# BTmiwKWCqCI0wrmd2TaDEWUNccLIunmoHoGg+lzzZGE7TILOg/2C/vO/YShwBYSy
# oTn7Raa7m5quZ+9zOIt9TVJjbjQ5lbyV3ixLx+fJuf+MMyYUCFrNXXMfRARFYSx8
# tKnCQ5doiZY0UnmWZyd/VVObpyZ9qxJxi0SWmOpn0aigKaTVcUCk5E+z887jchwW
# Y9HBqC3TSJBLD6sF4gfTQpCr4UlP/rZIHvSD2D9HxNLqTpv/C3ZRaGqtb5DyXDpf
# OB7H9jCCB3EwggVZoAMCAQICEzMAAAAVxedrngKbSZkAAAAAABUwDQYJKoZIhvcN
# AQELBQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYD
# VQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMjAw
# BgNVBAMTKU1pY3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhvcml0eSAyMDEw
# MB4XDTIxMDkzMDE4MjIyNVoXDTMwMDkzMDE4MzIyNVowfDELMAkGA1UEBhMCVVMx
# EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
# FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUt
# U3RhbXAgUENBIDIwMTAwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQDk
# 4aZM57RyIQt5osvXJHm9DtWC0/3unAcH0qlsTnXIyjVX9gF/bErg4r25PhdgM/9c
# T8dm95VTcVrifkpa/rg2Z4VGIwy1jRPPdzLAEBjoYH1qUoNEt6aORmsHFPPFdvWG
# UNzBRMhxXFExN6AKOG6N7dcP2CZTfDlhAnrEqv1yaa8dq6z2Nr41JmTamDu6Gnsz
# rYBbfowQHJ1S/rboYiXcag/PXfT+jlPP1uyFVk3v3byNpOORj7I5LFGc6XBpDco2
# LXCOMcg1KL3jtIckw+DJj361VI/c+gVVmG1oO5pGve2krnopN6zL64NF50ZuyjLV
# wIYwXE8s4mKyzbnijYjklqwBSru+cakXW2dg3viSkR4dPf0gz3N9QZpGdc3EXzTd
# EonW/aUgfX782Z5F37ZyL9t9X4C626p+Nuw2TPYrbqgSUei/BQOj0XOmTTd0lBw0
# gg/wEPK3Rxjtp+iZfD9M269ewvPV2HM9Q07BMzlMjgK8QmguEOqEUUbi0b1qGFph
# AXPKZ6Je1yh2AuIzGHLXpyDwwvoSCtdjbwzJNmSLW6CmgyFdXzB0kZSU2LlQ+QuJ
# YfM2BjUYhEfb3BvR/bLUHMVr9lxSUV0S2yW6r1AFemzFER1y7435UsSFF5PAPBXb
# GjfHCBUYP3irRbb1Hode2o+eFnJpxq57t7c+auIurQIDAQABo4IB3TCCAdkwEgYJ
# KwYBBAGCNxUBBAUCAwEAATAjBgkrBgEEAYI3FQIEFgQUKqdS/mTEmr6CkTxGNSnP
# EP8vBO4wHQYDVR0OBBYEFJ+nFV0AXmJdg/Tl0mWnG1M1GelyMFwGA1UdIARVMFMw
# UQYMKwYBBAGCN0yDfQEBMEEwPwYIKwYBBQUHAgEWM2h0dHA6Ly93d3cubWljcm9z
# b2Z0LmNvbS9wa2lvcHMvRG9jcy9SZXBvc2l0b3J5Lmh0bTATBgNVHSUEDDAKBggr
# BgEFBQcDCDAZBgkrBgEEAYI3FAIEDB4KAFMAdQBiAEMAQTALBgNVHQ8EBAMCAYYw
# DwYDVR0TAQH/BAUwAwEB/zAfBgNVHSMEGDAWgBTV9lbLj+iiXGJo0T2UkFvXzpoY
# xDBWBgNVHR8ETzBNMEugSaBHhkVodHRwOi8vY3JsLm1pY3Jvc29mdC5jb20vcGtp
# L2NybC9wcm9kdWN0cy9NaWNSb29DZXJBdXRfMjAxMC0wNi0yMy5jcmwwWgYIKwYB
# BQUHAQEETjBMMEoGCCsGAQUFBzAChj5odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20v
# cGtpL2NlcnRzL01pY1Jvb0NlckF1dF8yMDEwLTA2LTIzLmNydDANBgkqhkiG9w0B
# AQsFAAOCAgEAnVV9/Cqt4SwfZwExJFvhnnJL/Klv6lwUtj5OR2R4sQaTlz0xM7U5
# 18JxNj/aZGx80HU5bbsPMeTCj/ts0aGUGCLu6WZnOlNN3Zi6th542DYunKmCVgAD
# sAW+iehp4LoJ7nvfam++Kctu2D9IdQHZGN5tggz1bSNU5HhTdSRXud2f8449xvNo
# 32X2pFaq95W2KFUn0CS9QKC/GbYSEhFdPSfgQJY4rPf5KYnDvBewVIVCs/wMnosZ
# iefwC2qBwoEZQhlSdYo2wh3DYXMuLGt7bj8sCXgU6ZGyqVvfSaN0DLzskYDSPeZK
# PmY7T7uG+jIa2Zb0j/aRAfbOxnT99kxybxCrdTDFNLB62FD+CljdQDzHVG2dY3RI
# LLFORy3BFARxv2T5JL5zbcqOCb2zAVdJVGTZc9d/HltEAY5aGZFrDZ+kKNxnGSgk
# ujhLmm77IVRrakURR6nxt67I6IleT53S0Ex2tVdUCbFpAUR+fKFhbHP+CrvsQWY9
# af3LwUFJfn6Tvsv4O+S3Fb+0zj6lMVGEvL8CwYKiexcdFYmNcP7ntdAoGokLjzba
# ukz5m/8K6TT4JDVnK+ANuOaMmdbhIurwJ0I9JZTmdHRbatGePu1+oDEzfbzL6Xu/
# OHBE0ZDxyKs6ijoIYn/ZcGNTTY3ugm2lBRDBcQZqELQdVTNYs6FwZvKhggNZMIIC
# QQIBATCCAQGhgdmkgdYwgdMxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
# dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9y
# YXRpb24xLTArBgNVBAsTJE1pY3Jvc29mdCBJcmVsYW5kIE9wZXJhdGlvbnMgTGlt
# aXRlZDEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOjMyMUEtMDVFMC1EOTQ3MSUw
# IwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNloiMKAQEwBwYFKw4D
# AhoDFQC2RC395tZJDkOcb5opHM8QsIUT0aCBgzCBgKR+MHwxCzAJBgNVBAYTAlVT
# MRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
# ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1l
# LVN0YW1wIFBDQSAyMDEwMA0GCSqGSIb3DQEBCwUAAgUA7BjboDAiGA8yMDI1MDcw
# OTEyMTQyNFoYDzIwMjUwNzEwMTIxNDI0WjB3MD0GCisGAQQBhFkKBAExLzAtMAoC
# BQDsGNugAgEAMAoCAQACAgdwAgH/MAcCAQACAhMmMAoCBQDsGi0gAgEAMDYGCisG
# AQQBhFkKBAIxKDAmMAwGCisGAQQBhFkKAwKgCjAIAgEAAgMHoSChCjAIAgEAAgMB
# hqAwDQYJKoZIhvcNAQELBQADggEBAE8RpKa2QlVjgXWsnuehYgaGw6Eli1QYouFY
# GPoS5uFfKKremKpf1L51QUzmqd6zu0teE30JVFBK8VQ1GYFGcAkEGoanDH14465f
# 2hjpm6wDvF1KYu/59NEUZ6VeURSMEpUVGbKxTufdfVEHaedEMVhAkUK5Cd28dIUC
# V4CaDPWapbRFVktjW1nMyrQLnP6J3qPKwc0zmHDjmr0JBGJGjaf/mm3Sw7AqJ8h6
# nCvorsYCMNROgJPlq3cvNOdszUrwNK5bR+VNRNqJu8FFKEvfKL7Nb7vurAax1Oc8
# teFK7k8x/rYnBNNP3sCUzZ9miUKYRTMxv5wuufu4jyhleypxcU8xggQNMIIECQIB
# ATCBkzB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
# BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYD
# VQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAAfijoSYMDEBI
# /gABAAAB+DANBglghkgBZQMEAgEFAKCCAUowGgYJKoZIhvcNAQkDMQ0GCyqGSIb3
# DQEJEAEEMC8GCSqGSIb3DQEJBDEiBCDW0iMq4A/3X6uviX+IjeSpE3kJ4UxQUVHN
# oyMZ8ZA45DCB+gYLKoZIhvcNAQkQAi8xgeowgecwgeQwgb0EIO/MM/JfDVSQBQVi
# 3xtHhR2Mz3RC/nGdVqIoPcjRnPdaMIGYMIGApH4wfDELMAkGA1UEBhMCVVMxEzAR
# BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
# Y3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3Rh
# bXAgUENBIDIwMTACEzMAAAH4o6EmDAxASP4AAQAAAfgwIgQgYv/LTTEcPNKS2I25
# nZGOf0umB17BrB1sxXRpcbBZ96QwDQYJKoZIhvcNAQELBQAEggIAeuYuGO/sZzhS
# BX6wJzvD8Y0LecKJ9m9PIs2uAPJ5vVjjRlXKKAXj2+u3T/Fsev/fhta3UKYkcyIZ
# J0v6hTNoWbr9eo/Nu0uzrQ6iy+DkqbfsGU9w8XlLsCPTy90IGhgCOwPdImorHZqu
# QbO088uw7avlGnVrWEJ/YS3ptUrCsRiddToRgmYALkTV6qSpNfqe8alzJFPpKS+D
# HpjDlmArMW3i6410Rtvo+4llDlezMcr2YMkxBB+ZFWXIR/hcD826QwlZoIiA1IUk
# HtWScvH//ruyXZZuEzS8HLPVOYSdtCQ44vy2Q3BdawzWnkIVU3wCfmaAzTb1Wqib
# CApj6ARx4l7JjYoPNOZMrX/qOtTlU+sAjhuICGNK4qRssVXJMsowc71k62ipU0ch
# M79tCO98kvf6tgbb4tyjTm28nM2LI1VgWA1CECOropBEvLrrrZr2EhwMBOBkVDvw
# 1Wz3ASYCZknVy/sZhGVjsw3HInvHvD9IrSCwkBRKBqj49v0WQYKn7MwsMod7tcwh
# uAQjRDZWA45zqPmhu8AudEV0pj4t0Pl7hvXC2k6CKvyRVgQoiuHrULCUVQ96PMyp
# gnxci/r/A6z9KLBASXu5Sj57d66wW9zknM5uIk+4rt4Ny/gpyVen7dPPm0qUNKpP
# 3xuL1sPsRSllP9m7rLL1L1cpGv6LCfc=
# SIG # End signature block
