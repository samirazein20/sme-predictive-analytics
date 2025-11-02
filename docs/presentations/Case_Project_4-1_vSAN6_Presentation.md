# vSAN in vSphere 6.0 — 10‑Minute Briefing (Case Project 4‑1)

Audience: vSphere admins new to vSAN 6.0. Goal: enable vSAN (manual disk claim), validate health, and understand design basics.

---

## Slide 1 — What is vSAN?
- Hyperconverged storage built into the ESXi hypervisor
- Aggregates local disks into a shared vsanDatastore
- Storage Policy Based Management (SPBM) controls availability and performance
- vSAN 6.0 = Original Storage Architecture (cache + capacity via disk groups)

Speaker notes:
- vSAN is part of ESXi — no extra VIBs in 6.0. It pools local storage and exposes a single vsanDatastore per cluster. Policies define failures to tolerate (FTT), stripe width, etc.

---

## Slide 2 — Prerequisites (Hardware/Hosts)
- 3+ ESXi 6.0 hosts contributing storage (4 recommended for rebuild capacity)
- Each storage host: at least 1 flash device (cache) + 1 or more HDD/SSD (capacity)
- HCL-compliant controllers and drives (vSAN HCL)
- Memory sizing: allow for up to 5 disk groups and 7 capacity devices per host

Speaker notes:
- vSAN ReadyNodes simplify compliance. Hybrid supports 1/10GbE; All‑Flash requires 10GbE. See vSphere 6.0 configuration maximums and vSAN HCL.

References: 4sysops (network/hardware), VMware vSphere 6.0 Configuration Maximums (link in references)

---

## Slide 3 — Networking for vSAN 6.0
- Dedicated VMkernel adapter with “Virtual SAN traffic” enabled on each host
- Same L2 subnet for vSAN traffic across hosts
- Hybrid: 1GbE supported (10GbE strongly recommended). All‑Flash: 10GbE only
- Historical note: vSAN 6.0 uses multicast for cluster membership and metadata

Speaker notes:
- Configure a dedicated portgroup/uplink where possible. In early releases (5.5/6.0), multicast/IGMP snooping/querier on the physical network was required for discovery/communication; later versions moved to unicast.

References: 4sysops (multicast and IGMP snooping guidance)

---

## Slide 4 — Disk Groups (Core Concept)
- A disk group = 1 cache SSD + 1–7 capacity devices (HDD in Hybrid; SSD in All‑Flash)
- Multiple disk groups per host are allowed (up to config maximums)
- Disk group = failure domain (cache device failure impacts the whole group)
- More groups often yield more cache, IOPS, and smaller failure domains

Speaker notes:
- Per Duncan Epping, multiple disk groups can improve performance/fault domains. Cache is a mandatory SSD per group.

References: Yellow‑Bricks (one vs multiple disk groups)

---

## Slide 5 — Enable vSAN (Manual Disk Claim)
- vSphere Web Client > Cluster > Manage > Settings > Virtual SAN > General > Edit
- Turn ON Virtual SAN
- Add disks to storage: choose Manual (recommended for control)
- HA must be temporarily disabled to turn on vSAN in 6.0

Speaker notes:
- Manual mode prevents auto-claiming non‑intended devices. After enabling, proceed to Disk Management to create disk groups.

References: VirtuallyBoring (vSAN 6.0 enablement UX)

---

## Slide 6 — Create Disk Groups (Manual Claim)
- Cluster > Manage > Settings > Virtual SAN > Disk Management
- Click “Claim Disks”
- For each host: select 1 SSD as Cache and 1–7 Capacity disks
- Finish to create disk groups; vsanDatastore appears/expands

Speaker notes:
- Manual claim steps are documented in KBs and walkthroughs. Each host contributing storage needs at least one disk group.

References: VirtuallyBoring; Broadcom KB summary (manual claim)

---

## Slide 7 — Validate: Health and Connectivity
- Cluster > Monitor > vSAN > Health/Skyline Health
- Check: Network health (vmknic configured for vSAN, across all hosts)
- If using 6.0 networks with multicast: ensure IGMP snooping and querier are correct
- HCL DB up‑to‑date; retest health after any changes

Speaker notes:
- Use vmkping between vSAN VMkernel IPs to validate L2 reachability if needed. Keep HCL DB current for accurate checks.

References: 4sysops; VMware KB (HCL DB update)

---

## Slide 8 — SPBM: Policies Drive Layout
- Define FTT (e.g., RAID‑1 mirror with FTT=1)
- Stripe width and object space reservation as needed
- Apply at VM/VMDK granularity; vSAN places components accordingly

Speaker notes:
- Even in 6.0, SPBM is the control plane. Start simple: FTT=1, default stripe, and adjust per workload.

---

## Slide 9 — Ops Tips and Limits (vSphere 6.0)
- One vsanDatastore per cluster (single namespace)
- Up to 5 disk groups per host; up to 7 capacity devices per group
- Plan network redundancy (NIC teaming) and isolate vSAN traffic
- Monitor capacity: add disks/groups to scale; rebalance occurs as needed

Speaker notes:
- vSAN attempts space balancing around thresholds; adding capacity helps. Keep an eye on resyncs and storage policies compliance.

References: vSphere 6.0 maximums; 4sysops

---

## Slide 10 — Demo Walkthrough (6.0 Web Client)
1) Create vSAN VMkernel per host
   - Host > Manage > Networking > VMkernel adapters > Add > enable “Virtual SAN traffic”; assign IP
2) Disable HA on cluster
3) Enable vSAN (Manual) at Cluster > Manage > Settings > Virtual SAN > General > Edit
4) Create Disk Groups: Disk Management > Claim Disks (1 SSD cache + capacity per host)
5) Verify vsanDatastore and Health (Monitor > vSAN > Health)
6) Re‑enable HA

Speaker notes:
- Timebox: ~6 minutes. Screens: VMkernel add, vSAN General enable, Disk Management claim, Health overview.

---

## Slide 11 — Troubleshooting Quick Hits
- Hosts cannot communicate: verify vSAN VMkernel IPs, VLANs, vmkping
- No disks eligible: confirm device not used by VMFS, on HCL, and controller mode
- Health failures in 6.0: check multicast/IGMP snooping/querier on switches
- Update vSAN HCL DB and retest health

Speaker notes:
- Common early‑version gotchas: network multicast config and mis‑tagged VMkernel.

---

## Slide 12 — Key Takeaways
- Prepare network and HCL‑compliant hardware first
- Use Manual disk claim for precise control
- Multiple disk groups per host can improve performance/fault domains
- Validate with Health; manage via SPBM policies

Speaker notes:
- Start small and iterate. Keep firmware/HCL validated and monitor health routinely.

---

## Appendix — References (APA 7)
- VMware. (2015). vSphere 6.0 Configuration Maximums. https://www.vmware.com/pdf/vsphere6/r60/vsphere-60-configuration-maximums.pdf
- Seget, V. (2016, August 16). VMware VSAN – Hardware requirements. 4sysops. https://4sysops.com/archives/vmware-vsan-hardware-requirements/
- VirtuallyBoring (Daniel). (2015, August 14). VMware Virtual SAN 6 – Setup and Configuration [Part 2]. https://www.virtuallyboring.com/vmware-virtual-san-6-setup-and-configuration-part-2/
- Epping, D. (2014, May 22). One versus multiple VSAN disk groups per host. Yellow‑Bricks. https://www.yellow-bricks.com/2014/05/22/one-versus-multiple-vsan-diskgroups-per-host/
- Broadcom (VMware KB). (2025). Updating the vSAN HCL database manually (KB 2145116/315556). https://kb.vmware.com/s/article/2145116

Note: For vSAN 6.0 networking behavior (multicast requirement), see era‑specific design notes highlighted by 4sysops; later vSAN versions transitioned to unicast.
