import Vec2 from "vec2";

export function random(a: number, b: number): number {
  return Math.random() * (b - a) + a;
}

export function randomVec2(x0: number, y0: number, x1: number, y1: number): Vec2 {
  const x = random(x0, x1);
  const y = random(y0, y1);
  return new Vec2(x, y);
}

export function sleep(miliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, miliseconds));
}

export async function loadImage(src: string, width: number, height: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image(width, height);
    img.onload = _ => {
      resolve(img);
    }
    img.onerror = e => {
      reject(e);
    }
    img.src = src;
  });
}

export function toNumber(x: string): number {
  return +x;
}
