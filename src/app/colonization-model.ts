import { Attractor } from "./attractor";
import { Node } from "./node";
import KDBush from "kdbush";
import { randomVec2 } from "./util";
import Vec2 from "vec2";
import { Mask } from "./mask";

export class ColonizationModel {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    attractors: Array<Attractor>;
    nodes: Array<Node>;
    index: KDBush<Node>;
    mask: Mask;

    constructor(width: number, height: number, mask: Mask | undefined = undefined) {
        this.x0    = 0;
        this.y0    = 0;
        this.x1    = width;
        this.y1    = height;
        this.attractors = [];
        this.nodes      = [];
        this.index      = new KDBush([]);
        if (mask != undefined) {
            this.mask = mask;
        }
        else {
            this.mask  = new Mask(width, height);
        }
    }

    addNode(node: Node): void {
        this.nodes.push(node);
    }

    addAtractor(attractor: Attractor): void {
        this.attractors.push(attractor);
    }

    step(attractionDistance: number, pruneDistance: number, segmentLength: number): boolean {
        // update index
        this.updateIndex();
        this.associateAttractorsToNodes(attractionDistance, pruneDistance);
        const n = this.nodes.length;
        this.growNewNodes(segmentLength);
        this.pruneAttractors(pruneDistance);
        return this.nodes.length > n;
    }

    private updateIndex() {
        this.index = new KDBush(this.nodes, n => n.position.x, n => n.position.y);
    }

    private associateAttractorsToNodes(attractionDistance: number, pruneDistance: number) {
        for (let a of this.attractors) {
            let nodesInNeighborhood = this.getRelativeNeighborNodes(a, attractionDistance);
            let nodesInPruneZone    = this.getNodesWithinDistance(a, pruneDistance);
            let nodesToGrow         = nodesInNeighborhood.filter(n => {
                return !nodesInPruneZone.includes(n)
            });
            a.nodes = nodesInNeighborhood;
            for (let n of nodesToGrow) {
                n.attractors.push(a);
            }
        }
    }

    private getNodesWithinDistance(a: Attractor, distance: number): Array<Node> {
        let result = [];
        let temp = this.index.within(a.position.x, a.position.y, distance).map(id => this.nodes[id]);
        for (let n of temp) {
            if (this.segmentIsInside(a.position, n.position)) {
                result.push(n);
            }
        }
        return result;
    }

    private segmentIsInside(p1: Vec2, p2: Vec2): boolean {
        let n = 100;
        let l = 1.0 / n;
        for (let i = 1; i < n; i++) {
            const lambda = i * l;
            let p3 = p1.multiply(lambda, true).add(p2.multiply(1 - lambda, true));
            if (!this.pointIsInside(p3)) {
                return false;
            }
        }
        return true;
    }

    private getRelativeNeighborNodes(a: Attractor, attractionDistance: number): Array<Node> {
        let result = [];
        let nodesInAttractionZone = this.getNodesWithinDistance(a, attractionDistance);
        let fail: boolean;
        let aToP0, aToP1, p0ToP1: number;
        // p0 is a relative neighbor of attractor iff
        // for any point p1 that is closer to attractor than is p0,
        // p0 is closer to attractor than to p1
        for (let p0 of nodesInAttractionZone) {
            fail = false;
            for (let p1 of nodesInAttractionZone) {
                if (p0 == p1) {
                    continue;
                }
                aToP0 = a.position.distance(p0.position);
                aToP1 = a.position.distance(p1.position);
                p0ToP1 = p0.position.distance(p1.position);
                if (aToP1 > aToP0) {
                    continue;
                }
                if (aToP0 > p0ToP1) {
                    fail = true;
                    break;
                }
            }
            if (!fail) {
                result.push(p0);
            }
        }
        return result;
    }

    private pointIsInside(p: Vec2): boolean {
        const x = Math.floor(p.x);
        const y = Math.floor(p.y);
        return this.mask.at(x, y);
    }

    private growNewNodes(segmentLength: number): void {
        for (let node of this.nodes) {
            if (node.isAttracted()) {
                let newNode = this.getNextNode(node, segmentLength);
                if (this.pointIsInside(newNode.position)) {
                    newNode.parent = node;
                    let tempNode = node;
                    while (tempNode.parent != undefined) {
                        // When there are multiple child nodes, use the thickest of them all
                        if(tempNode.parent.thickness < tempNode.thickness + .05) {
                            tempNode.parent.thickness = tempNode.thickness + .02;
                        }
                        tempNode = tempNode.parent;
                    }
                    this.nodes.push(newNode);
                }
                node.attractors = [];
            }
        }
    }

    private calculateAverageDirection(node: Node): Vec2 {
        let r = new Vec2(0, 0);
        for (let a of node.attractors) {
            r.add(
                a.position.subtract(node.position, true)
            );
        }
        let noise = randomVec2(-1, -1, 1, 1).normalize();
        r.add(noise);
        r.divide(node.attractors.length);
        r.normalize();
        return r;
    }
    
    private getNextNode(node: Node, segmentLength: number): Node {
        let newNode = new Node();
        newNode.position = this.calculateAverageDirection(node);
        newNode.position.multiply(segmentLength);
        newNode.position.add(node.position);
        return newNode;
    }

    private pruneAttractors(pruneDistance: number) {
        for (let [iatt, att] of this.attractors.entries()) {
            if (att.attracts()) {
                let finished = true;
                for (let node of att.nodes) {
                    if (att.position.distance(node.position) > pruneDistance) {
                        finished = false;
                        break;
                    }
                }
                if (finished) {
                    this.attractors.splice(iatt, 1);
                }
            }
        }
    }

    private killAttractors(killDistance: number): void {
        for (let [iatt, att] of this.attractors.entries()) {
            const nodesInRadius = this.getNodesWithinDistance(att, killDistance);
            if (nodesInRadius.length > 0) {
                this.attractors.splice(iatt, 1);
            } 
        }
    }

    randomizeInteriorAttractors(n: number) {
        if (this.mask) {
            this.attractors = new Array<Attractor>(n);
            for (let i = 0; i < n; i++) {
                let pos = new Vec2(0, 0);
                let valid = false;
                while (!valid) {
                    pos = randomVec2(0, 0, this.mask.width, this.mask.height);
                    valid = this.pointIsInside(pos);
                }
                let a = new Attractor();
                a.position = pos;
                this.attractors[i] = a;
            }
        }
    }

    randomizeInteriorNodes(n: number) {
        if (this.mask) {
            this.nodes = new Array<Node>(n);
            for (let i = 0; i < n; i++) {
                let pos = new Vec2(0, 0);
                let valid = false;
                while (!valid) {
                    pos = randomVec2(0, 0, this.mask.width, this.mask.height);
                    valid = this.pointIsInside(pos);
                }
                let node = new Node();
                node.position = pos;
                this.nodes[i] = node;
            }
        }
    }


}
