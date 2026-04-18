import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FloatingPetals } from "@/components/FloatingPetals";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative p-4 text-center">
      <FloatingPetals />
      
      <div className="relative z-10 max-w-md bg-white/70 backdrop-blur-md p-12 rounded-3xl shadow-xl border border-accent/20 animate-in fade-in zoom-in duration-700">
        <h1 className="text-6xl font-serif text-primary mb-4">404</h1>
        <h2 className="text-2xl font-serif text-accent mb-6">Страница не найдена</h2>
        <p className="text-primary/70 mb-8 font-sans">
          Возможно, вы ввели неправильную ссылку или страница была удалена.
        </p>
        <Link href="/admin" className="inline-block">
          <Button className="bg-primary hover:bg-primary/90 text-white px-8 rounded-full">
            Вернуться на главную
          </Button>
        </Link>
      </div>
    </div>
  );
}
