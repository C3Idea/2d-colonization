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

export async function loadImage(path: string): Promise<HTMLImageElement> {
  let img = new Image();
  const imgLoadPromise = new Promise(resolve => {
    img = new Image();
    img.onload = resolve;
    img.src = path;
  });
  await imgLoadPromise;
  return img;
}

export function toNumber(x: string): number {
  return +x;
}
