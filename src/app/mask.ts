export class Mask {
    rows:  number;
    cols: number;
    private data: Array<Array<boolean>>;

    constructor(width: number, height: number) {
        this.rows = width;
        this.cols = height;
        this.data = Mask.ones(this.rows, this.cols);
        console.log(this);
    }

    at(i: number, j: number): boolean {
        console.log(this.rows, this.cols);
        if (i >= 0 && i < this.rows && j >= 0 && j < this.cols) {
            return this.data[i][j];
        }
        else {
            console.log(i, j);
        }
        return false;
    }

    static ones(rows: number, cols: number): Array<Array<boolean>> {
        return Array.from(Array(rows), _ => Array(cols).fill(true));
    }

}
