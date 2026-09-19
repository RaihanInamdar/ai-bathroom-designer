import * as THREE from 'three';
import { PlacedProduct } from '../../types';

export function createFixtureMesh(product: PlacedProduct, mats: any): THREE.Group {
  const group = new THREE.Group();
  group.name = product.instanceId;

  const w = product.width;   // X (ft)
  const d = product.depth;   // Z (ft)
  const h = product.height;  // Y (ft)

  const isGold = product.finish.toLowerCase().includes('gold') || product.finish.toLowerCase().includes('brass');
  const isBlack = product.finish.toLowerCase().includes('black') || product.finish.toLowerCase().includes('charcoal');
  const metalMat = isGold ? mats.goldMaterial : (isBlack ? mats.matteBlackMaterial : mats.chromeMaterial);

  switch (product.category) {
    case 'smart_toilet':
    case 'toilet': {
      if (product.meshType === 'wall_toilet_curved') {
        // --- 1. FLOATING WALL-HUNG SMART BIDET TOILET ---
        // Suspended vitreous bowl
        const bowlGeo = new THREE.CylinderGeometry(w * 0.44, w * 0.32, h * 0.65, 32);
        const bowlMesh = new THREE.Mesh(bowlGeo, mats.ceramicWhite);
        bowlMesh.position.set(0, (h * 0.65) / 2 + 0.38, d * 0.08);
        bowlMesh.castShadow = true;
        group.add(bowlMesh);

        // Slim Ergonomic Heated Lid
        const lidGeo = new THREE.CylinderGeometry(w * 0.45, w * 0.45, 0.05, 32);
        const lidMesh = new THREE.Mesh(lidGeo, mats.ceramicWhite);
        lidMesh.position.set(0, h * 0.65 + 0.41, d * 0.08);
        group.add(lidMesh);

        // Subtle Nightlight Glow Ring
        const ringGeo = new THREE.TorusGeometry(w * 0.38, 0.02, 16, 32);
        const ringMesh = new THREE.Mesh(ringGeo, mats.ledGlowCyan || mats.goldMaterial);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.set(0, h * 0.65 + 0.38, d * 0.08);
        group.add(ringMesh);

        // Wall-Mounted Flush Actuator Plate
        const plateGeo = new THREE.BoxGeometry(0.85, 0.55, 0.04);
        const plateMesh = new THREE.Mesh(plateGeo, metalMat);
        plateMesh.position.set(0, 2.6, -d * 0.38);
        group.add(plateMesh);

        // Dual-flush circular push buttons
        [-0.18, 0.18].forEach((bx, idx) => {
          const btnGeo = new THREE.CylinderGeometry(idx === 0 ? 0.09 : 0.07, idx === 0 ? 0.09 : 0.07, 0.02, 24);
          const btnMesh = new THREE.Mesh(btnGeo, mats.ceramicWhite);
          btnMesh.rotation.x = Math.PI / 2;
          btnMesh.position.set(bx, 2.6, -d * 0.38 + 0.025);
          group.add(btnMesh);
        });
      } else if (product.meshType === 'classic_toilet') {
        // --- 2. MEMOIRS CLASSIC ARCHITECTURAL STEPPED TOILET ---
        // Stepped flared base pedestal
        const baseGeo = new THREE.BoxGeometry(w * 0.82, h * 0.65, d * 0.75);
        const baseMesh = new THREE.Mesh(baseGeo, mats.ceramicWhite);
        baseMesh.position.y = (h * 0.65) / 2;
        baseMesh.castShadow = true;
        group.add(baseMesh);

        // Flared crown pedestal trim
        const trimGeo = new THREE.BoxGeometry(w * 0.88, 0.08, d * 0.82);
        const trimMesh = new THREE.Mesh(trimGeo, mats.ceramicWhite);
        trimMesh.position.y = 0.04;
        group.add(trimMesh);

        // Tall Architectural Tank
        const tankGeo = new THREE.BoxGeometry(w * 0.94, h * 0.58, d * 0.34);
        const tankMesh = new THREE.Mesh(tankGeo, mats.ceramicWhite);
        tankMesh.position.set(0, h * 0.65 + (h * 0.58) / 2, -d * 0.24);
        tankMesh.castShadow = true;
        group.add(tankMesh);

        // Crown Molded Tank Lid
        const lidGeo = new THREE.BoxGeometry(w * 1.0, 0.08, d * 0.38);
        const lidMesh = new THREE.Mesh(lidGeo, mats.ceramicWhite);
        lidMesh.position.set(0, h * 0.65 + h * 0.58 + 0.04, -d * 0.24);
        group.add(lidMesh);

        // Traditional Turned Brass Trip Lever
        const leverStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15, 12), mats.goldMaterial);
        leverStem.rotation.z = Math.PI / 2;
        leverStem.position.set(-w * 0.47, h * 1.15, -d * 0.2);
        group.add(leverStem);

        const leverHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.015, 0.22, 12), mats.goldMaterial);
        leverHandle.position.set(-w * 0.54, h * 1.1, -d * 0.2);
        group.add(leverHandle);
      } else {
        // --- 3. VERRE STUDIO NUMI 2.0 / VEIL MONOLITHIC SMART TOILET ---
        const bodyMat = product.id.includes('numi') ? mats.matteBlackMaterial : mats.ceramicWhite;

        // Monolithic Chamfered Shroud
        const baseGeo = new THREE.BoxGeometry(w * 0.86, h * 0.7, d * 0.86);
        const baseMesh = new THREE.Mesh(baseGeo, bodyMat);
        baseMesh.position.y = (h * 0.7) / 2;
        baseMesh.castShadow = true;
        group.add(baseMesh);

        // Angular Soft-Close Lid
        const lidGeo = new THREE.BoxGeometry(w * 0.84, 0.05, d * 0.84);
        const lidMesh = new THREE.Mesh(lidGeo, bodyMat);
        lidMesh.position.set(0, h * 0.725, 0.01);
        group.add(lidMesh);

        // Signature Ambient LED Ground Wash Strip
        const glowGeo = new THREE.BoxGeometry(w * 0.88, 0.025, d * 0.88);
        const glowMesh = new THREE.Mesh(glowGeo, mats.ledGlowCyan || mats.goldMaterial);
        glowMesh.position.set(0, 0.06, 0);
        group.add(glowMesh);

        // Subtle rear touch glass control stripe
        const touchGeo = new THREE.BoxGeometry(w * 0.4, 0.01, 0.12);
        const touchMesh = new THREE.Mesh(touchGeo, mats.chromeMaterial);
        touchMesh.position.set(0, h * 0.75, -d * 0.3);
        group.add(touchMesh);
      }
      break;
    }

    case 'vanity': {
      if (product.meshType === 'vanity_slatted') {
        // --- 1. JAPANESE HINOKI WOOD SLATTED FLOATING VANITY ---
        const woodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.38, metalness: 0.05 });
        const cabGeo = new THREE.BoxGeometry(w, h * 0.55, d);
        const cabMesh = new THREE.Mesh(cabGeo, woodMat);
        cabMesh.position.y = h * 0.45;
        cabMesh.castShadow = true;
        group.add(cabMesh);

        // Individual vertical architectural wooden slats
        const numSlats = 16;
        const slatW = w / (numSlats * 1.6);
        for (let i = 0; i < numSlats; i++) {
          const slatGeo = new THREE.BoxGeometry(slatW, h * 0.52, 0.035);
          const slatMesh = new THREE.Mesh(slatGeo, woodMat);
          const posX = -w / 2 + (i + 0.5) * (w / numSlats);
          slatMesh.position.set(posX, h * 0.45, d / 2 + 0.02);
          group.add(slatMesh);
        }

        // Stone Countertop
        const topGeo = new THREE.BoxGeometry(w * 1.03, 0.08, d * 1.03);
        const topMesh = new THREE.Mesh(topGeo, mats.ceramicWhite);
        topMesh.position.set(0, h * 0.76, 0);
        topMesh.castShadow = true;
        group.add(topMesh);

        // Sculpted Stone Vessel Basin
        const basinGeo = new THREE.CylinderGeometry(0.7, 0.52, 0.38, 32);
        const basinMesh = new THREE.Mesh(basinGeo, mats.ceramicWhite);
        basinMesh.position.set(0, h * 0.95, 0);
        basinMesh.castShadow = true;
        group.add(basinMesh);

        // Chrome/Gold Pop-Up Center Drain
        const drainMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 24), metalMat);
        drainMesh.position.set(0, h * 0.78, 0);
        group.add(drainMesh);

        // Under-vanity LED Nightlight Strip
        const underGlow = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.02, 0.04), mats.ledGlowWarm);
        underGlow.position.set(0, h * 0.17, d * 0.4);
        group.add(underGlow);
      } else if (product.meshType === 'vanity_double') {
        // --- 2. MASTER SPA SUITE 60" DOUBLE VANITY ---
        const cabMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45 });
        const cabGeo = new THREE.BoxGeometry(w, h * 0.62, d);
        const cabMesh = new THREE.Mesh(cabGeo, cabMat);
        cabMesh.position.y = h * 0.45;
        cabMesh.castShadow = true;
        group.add(cabMesh);

        // Horizontal drawer division gap lines
        const lineGeo = new THREE.BoxGeometry(w * 0.98, 0.02, 0.02);
        const lineMesh = new THREE.Mesh(lineGeo, metalMat);
        lineMesh.position.set(0, h * 0.42, d / 2 + 0.015);
        group.add(lineMesh);

        // Dual Carrera Marble Countertop
        const topGeo = new THREE.BoxGeometry(w * 1.02, 0.09, d * 1.02);
        const topMesh = new THREE.Mesh(topGeo, mats.ceramicWhite);
        topMesh.position.set(0, h * 0.8, 0);
        topMesh.castShadow = true;
        group.add(topMesh);

        // Twin Vessel Basins & Faucets
        [-w * 0.26, w * 0.26].forEach((bx) => {
          const basinGeo = new THREE.CylinderGeometry(0.56, 0.42, 0.28, 32);
          const basinMesh = new THREE.Mesh(basinGeo, mats.ceramicWhite);
          basinMesh.position.set(bx, h * 0.94, 0);
          basinMesh.castShadow = true;
          group.add(basinMesh);

          // Pop-up drain
          const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16), metalMat);
          drain.position.set(bx, h * 0.82, 0);
          group.add(drain);

          // Mixer faucet stem
          const fStem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.75, 16), metalMat);
          fStem.position.set(bx, h * 0.95 + 0.35, -d * 0.3);
          fStem.castShadow = true;
          group.add(fStem);

          const fSpout = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.28), metalMat);
          fSpout.position.set(bx, h * 0.95 + 0.7, -d * 0.3 + 0.14);
          group.add(fSpout);
        });
      } else {
        // --- 3. BRAZN / CONTEMPORARY CANTILEVER FLOATING VANITY ---
        const cabMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 });
        const cabGeo = new THREE.BoxGeometry(w, h * 0.56, d);
        const cabMesh = new THREE.Mesh(cabGeo, cabMat);
        cabMesh.position.y = h * 0.48;
        cabMesh.castShadow = true;
        group.add(cabMesh);

        // Brushed accent handle channel
        const handleChannel = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, 0.03, 0.04), metalMat);
        handleChannel.position.set(0, h * 0.35, d / 2 + 0.02);
        group.add(handleChannel);

        // Seamless countertop
        const topGeo = new THREE.BoxGeometry(w * 1.02, 0.08, d * 1.02);
        const topMesh = new THREE.Mesh(topGeo, mats.ceramicWhite);
        topMesh.position.set(0, h * 0.8, 0);
        topMesh.castShadow = true;
        group.add(topMesh);

        // Undermount sloping basin
        const basinGeo = new THREE.CylinderGeometry(0.62, 0.44, 0.28, 32);
        const basinMesh = new THREE.Mesh(basinGeo, mats.ceramicWhite);
        basinMesh.position.set(0, h * 0.74, 0);
        group.add(basinMesh);

        // Pop-up drain
        const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 20), metalMat);
        drain.position.set(0, h * 0.62, 0);
        group.add(drain);
      }
      break;
    }

    case 'faucet': {
      if (product.meshType === 'faucet_waterfall') {
        // --- 1. BEITOU CASCADING WATERFALL SPOUT ---
        const stemGeo = new THREE.BoxGeometry(0.14, h * 0.65, 0.16);
        const stemMesh = new THREE.Mesh(stemGeo, metalMat);
        stemMesh.position.set(0, 2.75 + (h * 0.32), -0.18);
        stemMesh.castShadow = true;
        group.add(stemMesh);

        const chuteGeo = new THREE.BoxGeometry(0.28, 0.035, 0.42);
        const chuteMesh = new THREE.Mesh(chuteGeo, metalMat);
        chuteMesh.position.set(0, 2.75 + (h * 0.65), -0.04);
        group.add(chuteMesh);

        // Translucent water cascade ribbon
        const cascadeGeo = new THREE.PlaneGeometry(0.24, 0.4);
        const cascadeMesh = new THREE.Mesh(cascadeGeo, mats.waterMaterial);
        cascadeMesh.rotation.x = Math.PI / 4;
        cascadeMesh.position.set(0, 2.75 + (h * 0.45), 0.12);
        group.add(cascadeMesh);
      } else if (product.meshType === 'faucet_classic') {
        // --- 2. ARTIFACTS GOOSENECK FAUCET WITH CROSS HANDLES ---
        const spoutGeo = new THREE.CylinderGeometry(0.04, 0.04, h * 0.9, 20);
        const spoutMesh = new THREE.Mesh(spoutGeo, mats.goldMaterial);
        spoutMesh.position.set(0, 2.75 + (h * 0.45), -0.2);
        spoutMesh.castShadow = true;
        group.add(spoutMesh);

        const hookGeo = new THREE.TorusGeometry(0.12, 0.04, 16, 24, Math.PI);
        const hookMesh = new THREE.Mesh(hookGeo, mats.goldMaterial);
        hookMesh.rotation.z = -Math.PI / 2;
        hookMesh.position.set(0, 2.75 + (h * 0.9), -0.08);
        group.add(hookMesh);

        // Twin cross handles
        [-0.32, 0.32].forEach((hx) => {
          const hGeo = new THREE.BoxGeometry(0.18, 0.04, 0.18);
          const hMesh = new THREE.Mesh(hGeo, mats.goldMaterial);
          hMesh.position.set(hx, 2.75 + 0.22, -0.2);
          group.add(hMesh);
        });
      } else {
        // --- 3. PURIST ARCHITECTURAL MONOBLOC TALL MIXER ---
        const stemGeo = new THREE.CylinderGeometry(0.038, 0.038, h * 0.88, 20);
        const stemMesh = new THREE.Mesh(stemGeo, metalMat);
        stemMesh.position.set(0, 2.75 + (h * 0.44), -0.2);
        stemMesh.castShadow = true;
        group.add(stemMesh);

        const spoutGeo = new THREE.BoxGeometry(0.055, 0.035, 0.36);
        const spoutMesh = new THREE.Mesh(spoutGeo, metalMat);
        spoutMesh.position.set(0, 2.75 + (h * 0.88), -0.04);
        group.add(spoutMesh);

        // Cylindrical single lever pin handle
        const leverGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.18, 12);
        const leverMesh = new THREE.Mesh(leverGeo, metalMat);
        leverMesh.position.set(0.06, 2.75 + (h * 0.75), -0.2);
        leverMesh.rotation.z = Math.PI / 4;
        group.add(leverMesh);
      }
      break;
    }

    case 'shower': {
      // --- WALK-IN LUXURY SPA SHOWER ENCLOSURE ---
      // Flush Linear Drain Shower Tray
      const trayGeo = new THREE.BoxGeometry(w, 0.08, d);
      const trayMesh = new THREE.Mesh(trayGeo, mats.ceramicWhite);
      trayMesh.position.set(0, 0.04, 0);
      trayMesh.receiveShadow = true;
      group.add(trayMesh);

      // Stainless Steel Linear Trench Drain
      const drainGeo = new THREE.BoxGeometry(w * 0.85, 0.015, 0.18);
      const drainMesh = new THREE.Mesh(drainGeo, mats.chromeMaterial);
      drainMesh.position.set(0, 0.085, -d * 0.38);
      group.add(drainMesh);

      // 10mm Frameless Glass Side Screen
      const glassGeo1 = new THREE.BoxGeometry(0.03, h * 0.94, d);
      const glassMesh1 = new THREE.Mesh(glassGeo1, mats.glassMaterial);
      glassMesh1.position.set(-w / 2, (h * 0.94) / 2, 0);
      group.add(glassMesh1);

      // 10mm Front Glass Screen with Walk-in Opening
      const glassGeo2 = new THREE.BoxGeometry(w * 0.65, h * 0.94, 0.03);
      const glassMesh2 = new THREE.Mesh(glassGeo2, mats.glassMaterial);
      glassMesh2.position.set(-w * 0.175, (h * 0.94) / 2, d / 2);
      group.add(glassMesh2);

      // Polished Metal Glass Clamps & Stabilization Bar
      const clampGeo = new THREE.BoxGeometry(0.08, 0.06, 0.08);
      const clamp1 = new THREE.Mesh(clampGeo, metalMat);
      clamp1.position.set(-w / 2, h * 0.9, -d * 0.45);
      group.add(clamp1);

      const headerBar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, d, 16), metalMat);
      headerBar.rotation.x = Math.PI / 2;
      headerBar.position.set(-w / 2, h * 0.94, 0);
      group.add(headerBar);

      // Thermostatic Valve Control Dial Panel
      const valvePlate = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.03), metalMat);
      valvePlate.position.set(0, 3.8, -d * 0.46);
      group.add(valvePlate);

      // 12" Large Rainhead Arm & Square Disk
      const armGeo = new THREE.CylinderGeometry(0.03, 0.03, d * 0.45, 16);
      const armMesh = new THREE.Mesh(armGeo, metalMat);
      armMesh.rotation.x = Math.PI / 2;
      armMesh.position.set(0, h * 0.92, -d * 0.22);
      group.add(armMesh);

      const headGeo = new THREE.BoxGeometry(0.9, 0.04, 0.9);
      const headMesh = new THREE.Mesh(headGeo, metalMat);
      headMesh.position.set(0, h * 0.9, 0);
      headMesh.castShadow = true;
      group.add(headMesh);

      // Soft water droplet spray cone
      const sprayGeo = new THREE.ConeGeometry(0.65, h * 0.8, 16, 1, true);
      const sprayMesh = new THREE.Mesh(sprayGeo, mats.glassMaterial);
      sprayMesh.rotation.x = Math.PI;
      sprayMesh.position.set(0, (h * 0.8) / 2 + 0.1, 0);
      group.add(sprayMesh);
      break;
    }

    case 'bathtub': {
      if (product.meshType === 'bathtub_round') {
        // --- 1. JAPANESE HINOKI ROUND OFURO TUB ---
        const tubGeo = new THREE.CylinderGeometry(w * 0.5, w * 0.46, h, 36);
        const woodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.35 });
        const tubMesh = new THREE.Mesh(tubGeo, woodMat);
        tubMesh.position.y = h / 2;
        tubMesh.castShadow = true;
        group.add(tubMesh);

        // Brass hoops
        [h * 0.25, h * 0.75].forEach((by) => {
          const hoopGeo = new THREE.TorusGeometry(w * 0.49, 0.02, 16, 36);
          const hoopMesh = new THREE.Mesh(hoopGeo, mats.goldMaterial);
          hoopMesh.rotation.x = Math.PI / 2;
          hoopMesh.position.y = by;
          group.add(hoopMesh);
        });

        // Translucent steamy water
        const waterGeo = new THREE.CircleGeometry(w * 0.47, 36);
        const waterMesh = new THREE.Mesh(waterGeo, mats.waterMaterial);
        waterMesh.rotation.x = -Math.PI / 2;
        waterMesh.position.y = h * 0.9;
        group.add(waterMesh);
      } else {
        // --- 2. ABRAZO FREESTANDING DOUBLE-ENDED OVAL SOAKING TUB ---
        // Smooth contoured exterior tub
        const tubGeo = new THREE.CylinderGeometry(w * 0.48, w * 0.38, h * 0.82, 36);
        tubGeo.scale(1.0, 1.0, d / w);
        const tubMesh = new THREE.Mesh(tubGeo, mats.ceramicWhite);
        tubMesh.position.y = (h * 0.82) / 2;
        tubMesh.castShadow = true;
        group.add(tubMesh);

        // Inner basin cavity (subtle darker rim lip)
        const rimGeo = new THREE.TorusGeometry(w * 0.46, 0.04, 16, 36);
        rimGeo.scale(1.0, d / w, 1.0);
        const rimMesh = new THREE.Mesh(rimGeo, mats.ceramicWhite);
        rimMesh.rotation.x = Math.PI / 2;
        rimMesh.position.y = h * 0.82;
        group.add(rimMesh);

        // Water surface
        const waterGeo = new THREE.CircleGeometry(w * 0.44, 36);
        waterGeo.scale(1.0, d / w, 1.0);
        const waterMesh = new THREE.Mesh(waterGeo, mats.waterMaterial);
        waterMesh.rotation.x = -Math.PI / 2;
        waterMesh.position.y = h * 0.72;
        group.add(waterMesh);

        // Pop-up Center Drain Stopper
        const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 20), mats.chromeMaterial);
        drain.position.y = 0.08;
        group.add(drain);

        // --- FLOOR-MOUNTED GOOSENECK TUB FILLER TAP ---
        const fillerFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.04, 20), metalMat);
        fillerFlange.position.set(-w * 0.52, 0.02, 0);
        group.add(fillerFlange);

        const fillerPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, h * 1.05, 16), metalMat);
        fillerPipe.position.set(-w * 0.52, (h * 1.05) / 2, 0);
        fillerPipe.castShadow = true;
        group.add(fillerPipe);

        const fillerArch = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 16, 24, Math.PI), metalMat);
        fillerArch.rotation.z = -Math.PI / 2;
        fillerArch.position.set(-w * 0.52 + 0.18, h * 1.05, 0);
        group.add(fillerArch);

        // Handheld sprayer wand
        const wandMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.45, 12), metalMat);
        wandMesh.position.set(-w * 0.52, h * 0.85, 0.15);
        wandMesh.rotation.x = Math.PI / 6;
        group.add(wandMesh);
      }
      break;
    }

    case 'mirror': {
      const wallOffset = -d / 2 + 0.03;
      if (product.meshType === 'mirror_round') {
        // --- 1. ENSO ROUND HALO BACKLIT MIRROR ---
        const discGeo = new THREE.CylinderGeometry(w * 0.46, w * 0.46, 0.03, 36);
        const discMesh = new THREE.Mesh(discGeo, mats.mirrorGlass);
        discMesh.rotation.x = Math.PI / 2;
        discMesh.position.set(0, 3.8 + (h / 2), wallOffset);
        group.add(discMesh);

        // Ambient 2700K Glow Halo
        const haloGeo = new THREE.TorusGeometry(w * 0.48, 0.035, 16, 36);
        const haloMesh = new THREE.Mesh(haloGeo, mats.ledGlowWarm);
        haloMesh.position.set(0, 3.8 + (h / 2), wallOffset - 0.02);
        group.add(haloMesh);

        // Touch sensor dot
        const dotMesh = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), mats.ledGlowWarm);
        dotMesh.position.set(0, 3.8 + (h * 0.2), wallOffset + 0.016);
        group.add(dotMesh);
      } else {
        // --- 2. VERDERA ARCHITECTURAL SMART LIGHTED MIRROR ---
        const frameGeo = new THREE.BoxGeometry(w, h, 0.04);
        const frameMesh = new THREE.Mesh(frameGeo, mats.mirrorGlass);
        frameMesh.position.set(0, 3.8 + (h / 2), wallOffset);
        group.add(frameMesh);

        // Warm Perimeter Cove Backlight
        const glowGeo = new THREE.BoxGeometry(w * 1.05, h * 1.05, 0.02);
        const glowMesh = new THREE.Mesh(glowGeo, mats.ledGlowWarm);
        glowMesh.position.set(0, 3.8 + (h / 2), wallOffset - 0.02);
        group.add(glowMesh);

        // Minimalist frame border
        const borderGeo = new THREE.BoxGeometry(w * 1.02, h * 1.02, 0.03);
        const borderMesh = new THREE.Mesh(borderGeo, metalMat);
        borderMesh.position.set(0, 3.8 + (h / 2), wallOffset - 0.01);
        group.add(borderMesh);
      }
      break;
    }

    case 'accessory': {
      // --- THERMAGRID HEATED TOWEL LADDER WITH DRAPED TOWEL ---
      const barGeo = new THREE.CylinderGeometry(0.022, 0.022, h, 16);
      [-w / 2, w / 2].forEach((bx) => {
        const barMesh = new THREE.Mesh(barGeo, metalMat);
        barMesh.position.set(bx, 2.5 + (h / 2), 0);
        barMesh.castShadow = true;
        group.add(barMesh);
      });

      for (let i = 0; i < 5; i++) {
        const rungGeo = new THREE.CylinderGeometry(0.018, 0.018, w, 16);
        const rung = new THREE.Mesh(rungGeo, metalMat);
        rung.rotation.z = Math.PI / 2;
        rung.position.set(0, 2.5 + (i * (h / 4.2)), 0);
        rung.castShadow = true;
        group.add(rung);
      }

      // Draped Plush Bath Towel
      const towelMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
      const towelGeo = new THREE.BoxGeometry(w * 0.75, h * 0.38, 0.06);
      const towelMesh = new THREE.Mesh(towelGeo, towelMat);
      towelMesh.position.set(0, 2.5 + h * 0.45, 0.04);
      towelMesh.castShadow = true;
      group.add(towelMesh);
      break;
    }

    default: {
      const boxGeo = new THREE.BoxGeometry(w, h, d);
      const boxMesh = new THREE.Mesh(boxGeo, mats.ceramicWhite);
      boxMesh.position.y = h / 2;
      boxMesh.castShadow = true;
      group.add(boxMesh);
      break;
    }
  }

  return group;
}
