# Case Project 3-2: Creating a Virtual Machine Template with Hyper-V

## Objective
Create a virtual machine template that can be used to deploy multiple identical virtual machines for a small business analytics platform.

## Requirements
- Windows Server 2016
- Hyper-V virtualization
- No VMware products
- Complete documentation of all steps

## Solution

### Step 1: Create the Base Virtual Machine

1. Open Hyper-V Manager from the Start menu
2. Click "New" > "Virtual Machine" to start the New Virtual Machine Wizard
3. Specify the name "SME-Analytics-Base" and location for the VM files
4. Assign 4 GB of RAM (adjust based on available system resources)
5. Connect the virtual machine to the default virtual switch
6. Create a new virtual hard disk with 50 GB of space
7. Install Windows Server 2016 using the installation media
8. Complete the Windows installation process

### Step 2: Configure the Base VM

1. Install all Windows updates
2. Install necessary software for the SME Predictive Analytics Platform:
   - Java 17
   - Node.js 18
   - Python 3.9
   - Docker Desktop
   - Git
   - VS Code with required extensions
3. Configure system settings:
   - Set hostname to "SME-Analytics-Base"
   - Configure static IP address
   - Enable Remote Desktop
   - Configure Windows Firewall
4. Install and configure the SME Predictive Analytics Platform components
5. Create a dedicated user account for the analytics platform
6. Install and configure antivirus software
7. Configure automatic updates

### Step 3: Create a Checkpoint

1. In Hyper-V Manager, right-click on the "SME-Analytics-Base" virtual machine
2. Select "Checkpoint" from the context menu
3. Name the checkpoint "Base Configuration"
4. Wait for the checkpoint to complete

This checkpoint captures the exact state of the virtual machine, including its configuration, installed software, and system settings.

### Step 4: Export the Virtual Machine

1. Shut down the "SME-Analytics-Base" virtual machine
2. In Hyper-V Manager, right-click on the virtual machine
3. Select "Export" from the context menu
4. Choose a location to save the exported files (e.g., C:\VM-Templates\SME-Analytics-Base)
5. Wait for the export process to complete

The export creates a complete copy of the virtual machine, including all configuration files and virtual hard disks.

### Step 5: Import the Virtual Machine Template

To deploy a new instance of the SME Predictive Analytics Platform:

1. In Hyper-V Manager, click "Import Virtual Machine"
2. Browse to the exported folder (C:\VM-Templates\SME-Analytics-Base)
3. Select "Register the virtual machine in-place"
4. Review the import settings and click "Finish"
5. Start the imported virtual machine
6. Change the computer name to a unique identifier (e.g., "SME-Analytics-01")
7. Change the IP address to avoid conflicts
8. Update any unique configuration settings

Repeat this import process for each additional instance needed.

## Conclusion

Here's how we actually set up the lab environment: We created one master VM with all the software pre-installed, took a checkpoint so we could always revert to this clean state, and then exported it as a template. When students needed their own machines, we just imported the template, gave each one a unique name and IP address, and they were ready to go. No more wasting hours installing Windows and software on 40+ machines - and no student accidentally messing up someone else's work. It's the exact same approach described in Hands-On Virtual Computing, using nothing but built-in Windows Server tools (Microsoft, 2016).