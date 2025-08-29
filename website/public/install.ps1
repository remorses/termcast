#!/usr/bin/env pwsh
param(
  [String]$Version = "latest",
  # Skips adding the termcast.exe directory to the user's %PATH%
  [Switch]$NoPathUpdate = $false,
  # Skips adding termcast to the list of installed programs
  [Switch]$NoRegisterInstallation = $false,
  # Debugging: Always download with 'Invoke-RestMethod' instead of 'curl.exe'
  [Switch]$DownloadWithoutCurl = $false
);

# filter out 32 bit + ARM
if (-not ((Get-CimInstance Win32_ComputerSystem)).SystemType -match "x64-based") {
  Write-Output "Install Failed:"
  Write-Output "Termcast for Windows is currently only available for x86 64-bit Windows.`n"
  return 1
}

# This corresponds to .win10_rs5 in build.zig
$MinBuild = 17763;
$MinBuildName = "Windows 10 1809 / Windows Server 2019"

$WinVer = [System.Environment]::OSVersion.Version
if ($WinVer.Major -lt 10 -or ($WinVer.Major -eq 10 -and $WinVer.Build -lt $MinBuild)) {
  Write-Warning "Termcast requires at ${MinBuildName} or newer.`n`nThe install will still continue but it may not work.`n"
  return 1
}

$ErrorActionPreference = "Stop"

# These three environment functions are roughly copied from https://github.com/prefix-dev/pixi/pull/692
# They are used instead of `SetEnvironmentVariable` because of unwanted variable expansions.
function Publish-Env {
  if (-not ("Win32.NativeMethods" -as [Type])) {
    Add-Type -Namespace Win32 -Name NativeMethods -MemberDefinition @"
[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
public static extern IntPtr SendMessageTimeout(
    IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam,
    uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);
"@
  }
  $HWND_BROADCAST = [IntPtr] 0xffff
  $WM_SETTINGCHANGE = 0x1a
  $result = [UIntPtr]::Zero
  [Win32.NativeMethods]::SendMessageTimeout($HWND_BROADCAST,
    $WM_SETTINGCHANGE,
    [UIntPtr]::Zero,
    "Environment",
    2,
    5000,
    [ref] $result
  ) | Out-Null
}

function Write-Env {
  param([String]$Key, [String]$Value)

  $RegisterKey = Get-Item -Path 'HKCU:'

  $EnvRegisterKey = $RegisterKey.OpenSubKey('Environment', $true)
  if ($null -eq $Value) {
    $EnvRegisterKey.DeleteValue($Key)
  } else {
    $RegistryValueKind = if ($Value.Contains('%')) {
      [Microsoft.Win32.RegistryValueKind]::ExpandString
    } elseif ($EnvRegisterKey.GetValue($Key)) {
      $EnvRegisterKey.GetValueKind($Key)
    } else {
      [Microsoft.Win32.RegistryValueKind]::String
    }
    $EnvRegisterKey.SetValue($Key, $Value, $RegistryValueKind)
  }

  Publish-Env
}

function Get-Env {
  param([String] $Key)

  $RegisterKey = Get-Item -Path 'HKCU:'
  $EnvRegisterKey = $RegisterKey.OpenSubKey('Environment')
  $EnvRegisterKey.GetValue($Key, $null, [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
}

# The installation of termcast is it's own function
# There are also lots of sanity checks out of fear of anti-virus software or other weird Windows things happening.
function Install-Termcast {
  param(
    [string]$Version
  );

  # if a semver is given, we need to adjust it to this format: @termcast/cli@0.0.0
  if ($Version -match "^\d+\.\d+\.\d+$") {
    $Version = "@termcast/cli@$Version"
  }
  elseif ($Version -match "^v\d+\.\d+\.\d+$") {
    $Version = "@termcast/cli@$($Version.Substring(1))"
  }

  $Arch = "X64"

  $TermcastRoot = if ($env:TERMCAST_INSTALL) { $env:TERMCAST_INSTALL } else { "${Home}\.termcast" }
  $TermcastBin = mkdir -Force "${TermcastRoot}\bin"

  try {
    Remove-Item "${TermcastBin}\termcast.exe" -Force
  } catch [System.Management.Automation.ItemNotFoundException] {
    # ignore
  } catch [System.UnauthorizedAccessException] {
    $openProcesses = Get-Process -Name termcast | Where-Object { $_.Path -eq "${TermcastBin}\termcast.exe" }
    if ($openProcesses.Count -gt 0) {
      Write-Output "Install Failed - An older installation exists and is open. Please close open Termcast processes and try again."
      return 1
    }
    Write-Output "Install Failed - An unknown error occurred while trying to remove the existing installation"
    Write-Output $_
    return 1
  } catch {
    Write-Output "Install Failed - An unknown error occurred while trying to remove the existing installation"
    Write-Output $_
    return 1
  }

  $Target = "termcast-windows-$Arch.exe"
  $BaseURL = "https://github.com/remorses/termcast/releases"
  $URL = "$BaseURL/$(if ($Version -eq "latest") { "latest/download" } else { "download/$Version" })/$Target"

  $ExePath = "${TermcastBin}\termcast.exe"

  $DisplayVersion = $(
    if ($Version -eq "latest") { "Termcast" }
    elseif ($Version -match "^@termcast/cli@\d+\.\d+\.\d+$") { "Termcast $($Version.Substring(14))" }
    else { "Termcast tag='${Version}'" }
  )

  $null = mkdir -Force $TermcastBin
  Remove-Item -Force $ExePath -ErrorAction SilentlyContinue

  # curl.exe is faster than PowerShell 5's 'Invoke-WebRequest'
  # note: 'curl' is an alias to 'Invoke-WebRequest'. so the exe suffix is required
  if (-not $DownloadWithoutCurl) {
    curl.exe "-#SfLo" "$ExePath" "$URL"
  }
  if ($DownloadWithoutCurl -or ($LASTEXITCODE -ne 0)) {
    Write-Warning "The command 'curl.exe $URL -o $ExePath' exited with code ${LASTEXITCODE}`nTrying an alternative download method..."
    try {
      # Use Invoke-RestMethod instead of Invoke-WebRequest because Invoke-WebRequest breaks on
      # some machines, see
      Invoke-RestMethod -Uri $URL -OutFile $ExePath
    } catch {
      Write-Output "Install Failed - could not download $URL"
      Write-Output "The command 'Invoke-RestMethod $URL -OutFile $ExePath' exited with code ${LASTEXITCODE}`n"
      return 1
    }
  }

  if (!(Test-Path $ExePath)) {
    Write-Output "Install Failed - could not download $URL"
    Write-Output "The file '$ExePath' does not exist. Did an antivirus delete it?`n"
    return 1
  }

  $TermcastVersion = "$(& "${TermcastBin}\termcast.exe" --version 2>&1)"
  if ($LASTEXITCODE -eq 1073741795) { # STATUS_ILLEGAL_INSTRUCTION
    Write-Output "Install Failed - termcast.exe is not compatible with your CPU.`n"
    Write-Output "Please open a GitHub issue with your CPU model:`nhttps://github.com/remorses/termcast/issues/new/choose`n"
    return 1
  }
  # '-1073741515' was spotted in the wild, but not clearly documented as a status code:
  # https://discord.com/channels/876711213126520882/1149339379446325248/1205194965383250081
  # http://community.sqlbackupandftp.com/t/error-1073741515-solved/1305
  if (($LASTEXITCODE -eq 3221225781) -or ($LASTEXITCODE -eq -1073741515)) # STATUS_DLL_NOT_FOUND
  {
    Write-Output "Install Failed - You are missing a DLL required to run termcast.exe"
    Write-Output "This can be solved by installing the Visual C++ Redistributable from Microsoft:`nSee https://learn.microsoft.com/cpp/windows/latest-supported-vc-redist`nDirect Download -> https://aka.ms/vs/17/release/vc_redist.x64.exe`n`n"
    Write-Output "The command '${TermcastBin}\termcast.exe --version' exited with code ${LASTEXITCODE}`n"
    return 1
  }
  if ($LASTEXITCODE -ne 0) {
    Write-Output "Install Failed - could not verify termcast.exe"
    Write-Output "The command '${TermcastBin}\termcast.exe --version' exited with code ${LASTEXITCODE}`n"
    return 1
  }

  $DisplayVersion = $TermcastVersion

  $C_RESET = [char]27 + "[0m"
  $C_GREEN = [char]27 + "[1;32m"

  Write-Output "${C_GREEN}Termcast ${DisplayVersion} was installed successfully!${C_RESET}"
  Write-Output "The binary is located at ${TermcastBin}\termcast.exe`n"

  $hasExistingOther = $false;
  try {
    $existing = Get-Command termcast -ErrorAction
    if ($existing.Source -ne "${TermcastBin}\termcast.exe") {
      Write-Warning "Note: Another termcast.exe is already in %PATH% at $($existing.Source)`nTyping 'termcast' in your terminal will not use what was just installed.`n"
      $hasExistingOther = $true;
    }
  } catch {}

  if (-not $NoRegisterInstallation) {
    $rootKey = $null
    try {
      $RegistryKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Termcast"
      $rootKey = New-Item -Path $RegistryKey -Force
      New-ItemProperty -Path $RegistryKey -Name "DisplayName" -Value "Termcast" -PropertyType String -Force | Out-Null
      New-ItemProperty -Path $RegistryKey -Name "InstallLocation" -Value "${TermcastRoot}" -PropertyType String -Force | Out-Null
      New-ItemProperty -Path $RegistryKey -Name "DisplayIcon" -Value $TermcastBin\termcast.exe -PropertyType String -Force | Out-Null
      New-ItemProperty -Path $RegistryKey -Name "UninstallString" -Value "powershell -c `"& `'$TermcastRoot\uninstall.ps1`' -PauseOnError`" -ExecutionPolicy Bypass" -PropertyType String -Force | Out-Null
    } catch {
      if ($rootKey -ne $null) {
        Remove-Item -Path $RegistryKey -Force
      }
    }
  }

  if(!$hasExistingOther) {
    # Only try adding to path if there isn't already a termcast.exe in the path
    $Path = (Get-Env -Key "Path") -split ';'
    if ($Path -notcontains $TermcastBin) {
      if (-not $NoPathUpdate) {
        $Path += $TermcastBin
        Write-Env -Key 'Path' -Value ($Path -join ';')
        $env:PATH = $Path -join ';'
      } else {
        Write-Output "Skipping adding '${TermcastBin}' to the user's %PATH%`n"
      }
    }

    Write-Output "To get started, restart your terminal/editor, then type `"termcast`"`n"
  }

  $LASTEXITCODE = 0;
}

Install-Termcast -Version $Version
