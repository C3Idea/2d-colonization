import Vec2 from 'vec2';
import { Node } from './node';
import { randomVec2, random } from './util';

export class Attractor {
    position: Vec2;
    nodes: Array<Node>;
    reached: boolean;
    
    constructor() {
        this.position = new Vec2(0, 0);
        this.nodes    = [];
        this.reached  = false;
    }

    attracts(): boolean {
        return this.nodes.length > 0;
    }

    static getRandom(x0: number, y0: number, x1: number, y1: number): Attractor {
        let att = new Attractor();
        att.position = randomVec2(x0, y0, x1, y1);
        return att;
    };

    static getRandomList(n: number, x0: number, y0: number, x1: number, y1: number): Array<Attractor> {
        let result = [];
        for (let i = 0; i < n; i++) {
            let att = Attractor.getRandom(x0, y0, x1, y1)
            result.push(att);
        }
        return result;
    }

}
