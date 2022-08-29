export class Mask {
    width:  number;
    height: number;
    private data: Array<Array<boolean>>;

    constructor(width: number, height: number) {
        this.height = height;
        this.width  = width;
        this.data   = Mask.ones(this.width, this.height);
    }

    at(x: number, y: number): boolean {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.data[x][y];
        }
        return false;
    }

    private static ones(width: number, height: number): Array<Array<boolean>> {
        return Array.from(Array(width), _ => Array(height).fill(true));
    }

    static fromImageData(data: ImageData): Mask | undefined {
        const height = data.height;
        const width  = data.width;
        let mask = new Mask(width, height);
        for (let k = 0; k < data.data.length; k += 4) {
            const x = (k / 4) % mask.width;
            const y = Math.floor((k / 4) / mask.width);
            if (data.data[k] == 0) {
                mask.data[x][y] = false;
            }
        }
        return mask;
    };



}
