import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

// 3D background with floating, animated music notes
const NOTE_COLORS = [0x1DB954, 0x1ed760, 0xffffff, 0x8e24aa, 0x2196f3, 0xffc107];

function createMusicNoteMesh(color) {
  // Simple 3D music note: a sphere (note head) and a cylinder (stem)
  const group = new THREE.Group();
  const headGeo = new THREE.SphereGeometry(1.1, 24, 24);
  const headMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, metalness: 0.7, roughness: 0.3 });
  const head = new THREE.Mesh(headGeo, headMat);
  group.add(head);
  const stemGeo = new THREE.CylinderGeometry(0.22, 0.22, 3.2, 16);
  const stemMat = new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.2 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.set(0.7, 1.6, 0);
  stem.rotation.z = -0.3;
  group.add(stem);
  // Optionally add a flag (curved line)
  const flagCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0.7, 3, 0),
    new THREE.Vector3(2, 3.5, 0),
    new THREE.Vector3(2, 2.2, 0),
    new THREE.Vector3(0.7, 2.2, 0)
  );
  const flagPoints = flagCurve.getPoints(20);
  const flagGeo = new THREE.BufferGeometry().setFromPoints(flagPoints);
  const flagMat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const flag = new THREE.Line(flagGeo, flagMat);
  group.add(flag);
  return group;
}

const ThreeDBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    let width = window.innerWidth;
    let height = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 60;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Add soft colored lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const light1 = new THREE.PointLight(0x1DB954, 1.2, 200);
    light1.position.set(-30, 30, 40);
    scene.add(light1);
    const light2 = new THREE.PointLight(0x1ed760, 1.0, 200);
    light2.position.set(30, -30, 40);
    scene.add(light2);

    // Create floating music notes
    const notes = [];
    const noteCount = 18;
    for (let i = 0; i < noteCount; i++) {
      const color = NOTE_COLORS[i % NOTE_COLORS.length];
      const note = createMusicNoteMesh(color);
      note.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
      );
      note.userData = {
        speed: 0.2 + Math.random() * 0.5,
        rotSpeed: 0.002 + Math.random() * 0.004,
        floatPhase: Math.random() * Math.PI * 2
      };
      scene.add(note);
      notes.push(note);
    }

    // Animate the notes
    function animate(time) {
      requestAnimationFrame(animate);
      notes.forEach((note, i) => {
        // Floating up and down
        note.position.y += Math.sin(time / 900 + note.userData.floatPhase + i) * 0.01 * note.userData.speed;
        note.position.x += Math.cos(time / 1200 + note.userData.floatPhase + i) * 0.008 * note.userData.speed;
        note.rotation.y += note.userData.rotSpeed;
        note.rotation.x += note.userData.rotSpeed * 0.5;
        // Loop notes back to screen if they float too far
        if (note.position.y > 30) note.position.y = -30;
        if (note.position.y < -30) note.position.y = 30;
        if (note.position.x > 50) note.position.x = -50;
        if (note.position.x < -50) note.position.x = 50;
      });
      renderer.render(scene, camera);
    }
    animate(0);

    // Handle resize
    function handleResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    />
  );
};

export default ThreeDBackground;
