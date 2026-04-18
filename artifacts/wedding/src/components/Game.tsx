import { useEffect, useRef, useState } from "react";
import { useMarkGameCompleted, getGetGuestBySlugQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

interface GameProps {
  guestId: number;
  guestSlug: string;
  onComplete: () => void;
}

type Phase = "intro" | "level_transition" | "playing" | "game_over" | "victory";
type GoodType = "heart" | "flower" | "ring";
type ItemType = GoodType | "bad";

interface GameItem {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: ItemType;
  collected: boolean;
  collectScale: number;
  collectAlpha: number;
}

const LEVEL_CONFIGS = [
  { level: 1, good: 5, bad: 1, speedMin: 1.4, speedMax: 2.2 },
  { level: 2, good: 6, bad: 2, speedMin: 2.0, speedMax: 2.8 },
  { level: 3, good: 7, bad: 3, speedMin: 2.5, speedMax: 3.4 },
];
const ITEM_RADIUS = 28;
const GOOD_TYPES: GoodType[] = ["heart", "flower", "ring", "heart", "flower", "ring", "heart"];
const MAX_LIVES = 3;

export default function Game({ guestId, guestSlug, onComplete }: GameProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [collected, setCollected] = useState(0);
  const [flashRed, setFlashRed] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itemsRef = useRef<GameItem[]>([]);
  const phaseRef = useRef<Phase>("intro");
  const livesRef = useRef(MAX_LIVES);
  const collectedRef = useRef(0);
  const currentLevelRef = useRef(0);
  const frameRef = useRef(0);
  const tickRef = useRef(0);

  const markGameCompleted = useMarkGameCompleted();
  const queryClient = useQueryClient();
  const markRef = useRef(markGameCompleted.mutate);
  markRef.current = markGameCompleted.mutate;

  const levelCfg = LEVEL_CONFIGS[currentLevel] ?? LEVEL_CONFIGS[0];

  const initItems = (w: number, h: number, lvl: number) => {
    const cfg = LEVEL_CONFIGS[lvl];
    const items: GameItem[] = [];
    let id = 0;
    for (let i = 0; i < cfg.good; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
      items.push({
        id: id++,
        x: ITEM_RADIUS * 2 + Math.random() * (w - ITEM_RADIUS * 4),
        y: ITEM_RADIUS * 2 + Math.random() * (h * 0.55),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        type: GOOD_TYPES[i % GOOD_TYPES.length],
        collected: false,
        collectScale: 1,
        collectAlpha: 1,
      });
    }
    for (let i = 0; i < cfg.bad; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
      items.push({
        id: id++,
        x: ITEM_RADIUS * 2 + Math.random() * (w - ITEM_RADIUS * 4),
        y: ITEM_RADIUS * 2 + Math.random() * (h * 0.55),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        type: "bad",
        collected: false,
        collectScale: 1,
        collectAlpha: 1,
      });
    }
    itemsRef.current = items;
  };

  const startLevel = (lvl: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    initItems(canvas.width, canvas.height, lvl);
    collectedRef.current = 0;
    tickRef.current = 0;
    setCollected(0);
    phaseRef.current = "playing";
    setPhase("playing");
  };

  const startGame = () => {
    livesRef.current = MAX_LIVES;
    currentLevelRef.current = 0;
    setLives(MAX_LIVES);
    setCurrentLevel(0);
    startLevel(0);
  };

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cfg = LEVEL_CONFIGS[currentLevelRef.current];
    const totalGood = cfg.good;

    const loop = () => {
      const t = ++tickRef.current;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#FFF9F5");
      bg.addColorStop(1, "#EFE1D8");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const progress = collectedRef.current / totalGood;
      drawScene(ctx, w, h, progress);

      const goodLeft = itemsRef.current.filter((i) => !i.collected && i.type !== "bad").length;
      if (goodLeft > 0) {
        ctx.save();
        ctx.globalAlpha = 0.42 + 0.08 * Math.sin(t * 0.05);
        ctx.fillStyle = "#2C1810";
        ctx.font = `${clamp(12, 16, w * 0.033)}px Lato, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("Нажимайте на символы любви! Избегайте тёмных знаков.", w / 2, h * 0.90);
        ctx.restore();
      }

      itemsRef.current.forEach((item) => {
        if (item.collected) {
          item.collectScale += (2.0 - item.collectScale) * 0.15;
          item.collectAlpha *= 0.82;
          if (item.collectAlpha < 0.01) return;
          ctx.save();
          ctx.translate(item.x, item.y);
          ctx.scale(item.collectScale, item.collectScale);
          ctx.globalAlpha = item.collectAlpha;
          drawItemShape(ctx, item.type, ITEM_RADIUS, t);
          ctx.restore();
          return;
        }
        item.x += item.vx;
        item.y += item.vy;
        const m = ITEM_RADIUS + 8;
        if (item.x < m) { item.x = m; item.vx = Math.abs(item.vx); }
        if (item.x > w - m) { item.x = w - m; item.vx = -Math.abs(item.vx); }
        if (item.y < m + 28) { item.y = m + 28; item.vy = Math.abs(item.vy); }
        if (item.y > h * 0.60) { item.y = h * 0.60; item.vy = -Math.abs(item.vy); }
        const wobble = Math.sin(t * 0.045 + item.id * 1.4) * 2.5;
        ctx.save();
        ctx.translate(item.x, item.y + wobble);
        drawItemShape(ctx, item.type, ITEM_RADIUS, t + item.id * 15);
        ctx.restore();
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [phase, currentLevel]);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cfg = LEVEL_CONFIGS[currentLevelRef.current];
    const totalGood = cfg.good;

    const hit = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx = (clientX - rect.left) * scaleX;
      const cy = (clientY - rect.top) * scaleY;

      for (const item of itemsRef.current) {
        if (item.collected) continue;
        if (Math.hypot(cx - item.x, cy - item.y) <= ITEM_RADIUS * 1.7) {
          item.collected = true;
          item.collectScale = 1;
          item.collectAlpha = 1;

          if (item.type === "bad") {
            const newLives = livesRef.current - 1;
            livesRef.current = newLives;
            setLives(newLives);
            setFlashRed(true);
            setTimeout(() => setFlashRed(false), 400);
            if (newLives <= 0) {
              cancelAnimationFrame(frameRef.current);
              setTimeout(() => {
                phaseRef.current = "game_over";
                setPhase("game_over");
              }, 600);
            }
          } else {
            const newCount = ++collectedRef.current;
            setCollected(newCount);
            if (newCount >= totalGood) {
              const nextLvl = currentLevelRef.current + 1;
              cancelAnimationFrame(frameRef.current);
              if (nextLvl >= LEVEL_CONFIGS.length) {
                phaseRef.current = "victory";
                setPhase("victory");
                setTimeout(() => {
                  markRef.current(
                    { id: guestId },
                    {
                      onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: getGetGuestBySlugQueryKey(guestSlug) });
                        onComplete();
                      },
                    }
                  );
                }, 2600);
              } else {
                phaseRef.current = "level_transition";
                currentLevelRef.current = nextLvl;
                setCurrentLevel(nextLvl);
                setPhase("level_transition");
                setTimeout(() => startLevel(nextLvl), 1800);
              }
            }
          }
          break;
        }
      }
    };

    const onClick = (e: MouseEvent) => hit(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach((t) => hit(t.clientX, t.clientY));
    };
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("touchstart", onTouch, { passive: false });
    return () => {
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("touchstart", onTouch);
    };
  }, [phase, currentLevel, guestId, guestSlug, queryClient, onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(() => {
      if (phaseRef.current !== "playing") return;
      const oldW = canvas.width || 1;
      const oldH = canvas.height || 1;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      itemsRef.current.forEach((item) => {
        item.x = (item.x / oldW) * canvas.width;
        item.y = (item.y / oldH) * canvas.height;
      });
    });
    obs.observe(canvas);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="relative w-full h-full min-h-[380px]">
      {flashRed && (
        <div
          className="absolute inset-0 rounded-xl z-20 pointer-events-none"
          style={{ background: "rgba(220,38,38,0.22)", transition: "opacity 0.3s" }}
        />
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-xl touch-none select-none"
        style={{ display: phase === "playing" ? "block" : "none", cursor: "pointer" }}
      />

      {phase === "playing" && (
        <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none">
          <div className="flex justify-between items-center mb-1">
            <div className="flex gap-0.5">
              {Array.from({ length: MAX_LIVES }).map((_, i) => (
                <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill={i < lives ? "#D4A5A5" : "none"} stroke={i < lives ? "#C4928A" : "#D4A5A5"} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-sans text-[#2C1810]/60 bg-white/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                Уровень {currentLevel + 1}/3
              </span>
              <span className="text-xs font-sans text-[#2C1810]/60 bg-white/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {collected} / {levelCfg.good}
              </span>
            </div>
          </div>
          <div className="h-1.5 bg-white/40 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-[#C9A96E] rounded-full"
              animate={{ width: `${(collected / levelCfg.good) * 100}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 20 }}
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-[#FFF9F5] to-[#EFE1D8] rounded-xl"
          >
            <div className="mb-6 relative">
              <svg width="88" height="88" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="48" cy="48" r="44" fill="#FFF0E8" stroke="#C9A96E" strokeWidth="2"/>
                <path d="M48 65 C48 65 24 52 24 38 C24 30 30 24 38 24 C42 24 46 26 48 30 C50 26 54 24 58 24 C66 24 72 30 72 38 C72 52 48 65 48 65Z" fill="#D4A5A5" stroke="#C4928A" strokeWidth="1.5"/>
                <circle cx="30" cy="70" r="5" fill="#C9A96E" stroke="#B8946A" strokeWidth="1"/>
                <circle cx="66" cy="70" r="5" fill="#C9A96E" stroke="#B8946A" strokeWidth="1"/>
                <path d="M30 70 Q48 62 66 70" stroke="#C9A96E" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif text-[#2C1810] mb-3">Помогите им встретиться</h2>
            <p className="text-sm md:text-base text-[#2C1810]/60 mb-1 max-w-xs leading-relaxed">
              3 уровня, 3 жизни. Собирайте символы любви и избегайте тёмных знаков
            </p>
            <div className="flex items-center gap-3 mb-6 text-xs text-[#2C1810]/50">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-[#D4A5A5]" /> Собирайте
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-[#4a4a4a]" /> Избегайте
              </span>
            </div>
            <button
              onClick={startGame}
              className="bg-[#C9A96E] hover:bg-[#B8946A] text-white px-10 py-4 rounded-full text-base font-sans shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              Начать игру
            </button>
          </motion.div>
        )}

        {phase === "level_transition" && (
          <motion.div
            key={`lvl-${currentLevel}`}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-[#FFF9F5] to-[#EFE1D8] rounded-xl"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="text-5xl mb-4 font-serif text-[#C9A96E]"
            >
              {currentLevel + 1}
            </motion.div>
            <h3 className="text-2xl font-serif text-[#2C1810] mb-2">Уровень {currentLevel + 1}</h3>
            <p className="text-sm text-[#2C1810]/60">
              {currentLevel === 1 ? "Становится быстрее..." : "Финальный уровень!"}
            </p>
            <div className="flex gap-1 mt-4">
              {Array.from({ length: MAX_LIVES }).map((_, i) => (
                <svg key={i} width="22" height="22" viewBox="0 0 24 24" fill={i < lives ? "#D4A5A5" : "none"} stroke={i < lives ? "#C4928A" : "#D4A5A5"} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              ))}
            </div>
          </motion.div>
        )}

        {phase === "game_over" && (
          <motion.div
            key="game_over"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white/90 backdrop-blur-md rounded-xl"
          >
            <div className="text-4xl mb-4">
              <svg width="72" height="72" viewBox="0 0 96 96" fill="none">
                <circle cx="48" cy="48" r="44" fill="#FFF0E8" stroke="#C9A96E" strokeWidth="2"/>
                <path d="M48 65 C48 65 24 52 24 38 C24 30 30 24 38 24 C42 24 46 26 48 30 C50 26 54 24 58 24 C66 24 72 30 72 38 C72 52 48 65 48 65Z" fill="none" stroke="#C4928A" strokeWidth="2" strokeDasharray="4 3"/>
              </svg>
            </div>
            <h3 className="text-2xl font-serif text-[#2C1810] mb-2">Не беда!</h3>
            <p className="text-sm text-[#2C1810]/60 mb-6">Жизни закончились. Попробуйте ещё раз!</p>
            <button
              onClick={startGame}
              className="bg-[#C9A96E] hover:bg-[#B8946A] text-white px-8 py-3 rounded-full font-sans shadow-lg transition-all active:scale-95"
            >
              Попробовать снова
            </button>
          </motion.div>
        )}

        {phase === "victory" && (
          <motion.div
            key="victory"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white/88 backdrop-blur-md rounded-xl"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 6, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            >
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="36" fill="#FFF0E8" stroke="#C9A96E" strokeWidth="2"/>
                <path d="M40 58 C40 58 18 44 18 30 C18 22 24 16 32 16 C36 16 39 18 40 21 C41 18 44 16 48 16 C56 16 62 22 62 30 C62 44 40 58 40 58Z" fill="#D4A5A5"/>
              </svg>
            </motion.div>
            <h3 className="text-2xl md:text-3xl font-serif text-[#2C1810] mt-5 mb-3">Вы помогли им встретиться!</h3>
            <p className="text-[#2C1810]/60 text-sm">Открываем ваше приглашение...</p>
            <motion.div className="mt-6 h-1 w-24 bg-[#C9A96E]/40 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#C9A96E] rounded-full"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function clamp(min: number, max: number, val: number) {
  return Math.min(max, Math.max(min, val));
}

function drawItemShape(ctx: CanvasRenderingContext2D, type: ItemType, r: number, t: number) {
  ctx.save();
  if (type === "heart") drawHeart(ctx, r);
  else if (type === "flower") drawFlower(ctx, r, t);
  else if (type === "ring") drawRing(ctx, r);
  else drawBadItem(ctx, r, t);
  ctx.restore();
}

function drawHeart(ctx: CanvasRenderingContext2D, r: number) {
  const s = r * 0.85;
  ctx.save();
  ctx.shadowColor = "rgba(212, 165, 165, 0.5)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#D4A5A5";
  ctx.beginPath();
  ctx.moveTo(0, s * 0.3);
  ctx.bezierCurveTo(0, -s * 0.05, -s, -s * 0.05, -s, s * 0.42);
  ctx.bezierCurveTo(-s, s * 0.82, 0, s * 1.12, 0, s * 1.28);
  ctx.bezierCurveTo(0, s * 1.12, s, s * 0.82, s, s * 0.42);
  ctx.bezierCurveTo(s, -s * 0.05, 0, -s * 0.05, 0, s * 0.3);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.ellipse(-s * 0.28, s * 0.08, s * 0.22, s * 0.12, -0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFlower(ctx: CanvasRenderingContext2D, r: number, t: number) {
  const petals = 5;
  const spin = t * 0.008;
  ctx.save();
  ctx.shadowColor = "rgba(201, 169, 110, 0.4)";
  ctx.shadowBlur = 8;
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2 + spin;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = i % 2 === 0 ? "#E8C4C4" : "#F0D0C0";
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.52, r * 0.3, r * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#C9A96E";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(-r * 0.1, -r * 0.1, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRing(ctx: CanvasRenderingContext2D, r: number) {
  ctx.save();
  ctx.shadowColor = "rgba(201, 169, 110, 0.5)";
  ctx.shadowBlur = 10;
  ctx.strokeStyle = "#C9A96E";
  ctx.lineWidth = r * 0.3;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#E8D5A8";
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.95);
  ctx.lineTo(r * 0.2, -r * 0.76);
  ctx.lineTo(0, -r * 0.58);
  ctx.lineTo(-r * 0.2, -r * 0.76);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = r * 0.09;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, Math.PI * 1.12, Math.PI * 1.6);
  ctx.stroke();
  ctx.restore();
}

function drawBadItem(ctx: CanvasRenderingContext2D, r: number, t: number) {
  const spin = t * 0.012;
  ctx.save();
  ctx.rotate(spin);
  ctx.shadowColor = "rgba(80,30,20,0.4)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#3a1c1c";
  const spikes = 6;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r * 0.82 : r * 0.46;
    if (i === 0) ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
    else ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(180,60,60,0.7)";
  ctx.lineWidth = r * 0.1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, -r * 0.3);
  ctx.lineTo(r * 0.3, r * 0.3);
  ctx.moveTo(r * 0.3, -r * 0.3);
  ctx.lineTo(-r * 0.3, r * 0.3);
  ctx.stroke();
  ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, progress: number) {
  const groundY = h * 0.75;
  const s = Math.min(1, h / 480);
  const groomX = w * 0.12 + progress * w * 0.28;
  const brideX = w * 0.88 - progress * w * 0.28;

  ctx.save();
  ctx.strokeStyle = "rgba(201, 169, 110, 0.25)";
  ctx.setLineDash([6, 8]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(groomX + 12 * s, groundY - 18 * s);
  ctx.lineTo(brideX - 12 * s, groundY - 18 * s);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  drawGroom(ctx, groomX, groundY, s);
  drawBride(ctx, brideX, groundY, s);
}

function drawGroom(ctx: CanvasRenderingContext2D, x: number, baseY: number, s: number) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.fillStyle = "#2C1810";
  ctx.beginPath(); ctx.rect(-11 * s, -26 * s, 22 * s, 28 * s); ctx.fill();
  ctx.fillStyle = "#FFF9F5";
  ctx.beginPath(); ctx.rect(-4 * s, -26 * s, 8 * s, 14 * s); ctx.fill();
  ctx.fillStyle = "#C9A96E";
  ctx.beginPath();
  ctx.moveTo(-3.5 * s, -22 * s); ctx.lineTo(0, -19 * s);
  ctx.lineTo(3.5 * s, -22 * s); ctx.lineTo(0, -25 * s);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#F5CBA7";
  ctx.beginPath(); ctx.arc(0, -38 * s, 12 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#2C1810";
  ctx.beginPath(); ctx.arc(0, -47 * s, 11 * s, Math.PI, 0); ctx.fill();
  ctx.fillStyle = "#2C1810";
  ctx.beginPath(); ctx.rect(-10 * s, 2 * s, 8 * s, 14 * s); ctx.fill();
  ctx.beginPath(); ctx.rect(2 * s, 2 * s, 8 * s, 14 * s); ctx.fill();
  ctx.fillStyle = "#1A0F08";
  ctx.beginPath(); ctx.ellipse(-6 * s, 16 * s, 8 * s, 3.5 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(6 * s, 16 * s, 8 * s, 3.5 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawBride(ctx: CanvasRenderingContext2D, x: number, baseY: number, s: number) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(-9 * s, -24 * s); ctx.lineTo(9 * s, -24 * s);
  ctx.lineTo(26 * s, 18 * s); ctx.lineTo(-26 * s, 18 * s);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(232, 196, 196, 0.6)";
  ctx.lineWidth = 1 * s;
  ctx.beginPath(); ctx.moveTo(0, -24 * s); ctx.lineTo(0, 18 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-9 * s, -8 * s); ctx.lineTo(9 * s, -8 * s); ctx.stroke();
  ctx.fillStyle = "#F8F4F0";
  ctx.beginPath(); ctx.rect(-8 * s, -26 * s, 16 * s, 16 * s); ctx.fill();
  ctx.fillStyle = "#F5CBA7";
  ctx.beginPath(); ctx.arc(0, -40 * s, 12 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#D4956A";
  ctx.beginPath(); ctx.arc(0, -48 * s, 11 * s, Math.PI, 0); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.beginPath();
  ctx.moveTo(-2 * s, -52 * s);
  ctx.bezierCurveTo(14 * s, -44 * s, 18 * s, -8 * s, 16 * s, 8 * s);
  ctx.lineTo(11 * s, 8 * s);
  ctx.bezierCurveTo(12 * s, -6 * s, 9 * s, -38 * s, -2 * s, -46 * s);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#D4A5A5";
  ctx.beginPath(); ctx.arc(15 * s, -8 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#C9A96E";
  ctx.beginPath(); ctx.arc(18 * s, -12 * s, 3.5 * s, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
