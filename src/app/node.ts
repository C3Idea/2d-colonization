import Vec2 from "vec2";
import { Attractor } from "./attractor";
import { randomVec2 } from "./util";

export class Node {
    position:   Vec2;
    parent:     Node | undefined;
    attractors: Array<Attractor>;
    thickness:  number;

    constructor() {
        this.position = new Vec2(0, 0);
        this.parent   = undefined;
        this.attractors = [];
        this.thickness  = 0;
    }

    isAttracted() {
        return this.attractors.length > 0;
    }

    static getRandom(x0: number, y0: number, x1: number, y1: number): Node {
        let att = new Node();
        att.position = randomVec2(x0, y0, x1, y1);
        return att;
    };

    static getRandomList(n: number, x0: number, y0: number, x1: number, y1: number): Array<Node> {
        let result = [];
        for (let i = 0; i < n; i++) {
            let att = Node.getRandom(x0, y0, x1, y1)
            result.push(att);
        }
        return result;
    }
}

