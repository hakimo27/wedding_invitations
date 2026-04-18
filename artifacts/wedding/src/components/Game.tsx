import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useMarkGameCompleted } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetGuestBySlugQueryKey } from "@workspace/api-client-react";

interface GameProps {
  guestId: number;
  guestSlug: string;
  onComplete: () => void;
}

export default function Game({ guestId, guestSlug, onComplete }: GameProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const markGameCompleted = useMarkGameCompleted();
  const queryClient = useQueryClient();
  const markGameCompletedRef = useRef(markGameCompleted.mutate);
  markGameCompletedRef.current = markGameCompleted.mutate;

  useEffect(() => {
    if (!mountRef.current || gameEnded) return;

    const w = mountRef.current.clientWidth;
    const h = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfff9f5); // cream
    scene.fog = new THREE.Fog(0xfff9f5, 10, 50);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 5, 15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d5 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Groom (Blue cylinder)
    const groomGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 16);
    const groomMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
    const groom = new THREE.Mesh(groomGeo, groomMat);
    groom.position.set(-5, 0.75, 0);
    groom.castShadow = true;
    scene.add(groom);

    // Bride (White cylinder)
    const brideGeo = new THREE.CylinderGeometry(0.3, 0.5, 1.5, 16);
    const brideMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const bride = new THREE.Mesh(brideGeo, brideMat);
    bride.position.set(5, 0.75, 0);
    bride.castShadow = true;
    scene.add(bride);

    // Hearts/Flowers
    const items: THREE.Mesh[] = [];
    const itemGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const itemMat = new THREE.MeshStandardMaterial({ color: 0xd4a5a5 });

    for (let i = 0; i < 5; i++) {
      const item = new THREE.Mesh(itemGeo, itemMat);
      item.position.set(
        (Math.random() - 0.5) * 8,
        Math.random() * 5 + 3,
        (Math.random() - 0.5) * 8
      );
      item.userData = { id: i, collected: false };
      scene.add(item);
      items.push(item);
    }

    // Raycaster for clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event: MouseEvent | TouchEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
      
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(items);

      if (intersects.length > 0) {
        const object = intersects[0].object as THREE.Mesh;
        if (!object.userData.collected) {
          object.userData.collected = true;
          scene.remove(object);
          setScore(s => s + 1);
        }
      }
    };

    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('touchstart', onClick);

    // Animation Loop
    let currentScore = 0;
    setScore(s => { currentScore = s; return s; });

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);

      // Move items down
      items.forEach(item => {
        if (!item.userData.collected) {
          item.position.y -= 0.02;
          if (item.position.y < 0) {
            item.position.y = Math.random() * 5 + 5;
          }
        }
      });

      // Groom walking towards bride based on score
      const targetX = -5 + (currentScore / 5) * 9; // ends at x=4
      groom.position.x += (targetX - groom.position.x) * 0.1;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('touchstart', onClick);
      cancelAnimationFrame(reqId);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [gameEnded]);

  useEffect(() => {
    if (score >= 5 && !gameEnded) {
      setGameEnded(true);
      setTimeout(() => {
        markGameCompletedRef.current({ id: guestId }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetGuestBySlugQueryKey(guestSlug) });
            onComplete();
          }
        });
      }, 2000);
    }
  }, [score, gameEnded, guestId, guestSlug, queryClient, onComplete]);

  return (
    <div className="relative w-full h-full min-h-[400px] flex-col items-center justify-center bg-background rounded-xl overflow-hidden shadow-inner">
      <div className="absolute top-4 left-0 right-0 text-center z-10 pointer-events-none">
        <h2 className="text-2xl text-primary font-serif mb-2">Помогите им встретиться</h2>
        <p className="text-secondary font-sans font-bold">Собрано сердец: {score}/5</p>
      </div>
      <div ref={mountRef} className="w-full h-[60vh] md:h-[70vh] cursor-pointer" data-testid="game-canvas" />
      {score >= 5 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-20">
          <div className="text-center animate-in fade-in zoom-in duration-500">
            <h3 className="text-4xl text-primary font-serif mb-4">Вы помогли им найти друг друга!</h3>
            <p className="text-lg text-primary/80">Приглашение открывается...</p>
          </div>
        </div>
      )}
    </div>
  );
}
