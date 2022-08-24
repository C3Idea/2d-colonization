import { Attractor } from "./attractor";
import { Node } from "./node";
import KDBush from "kdbush";
import { randomVec2 } from "./util";
import Vec2 from "vec2";

export class ColonizationModel {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    attractors: Array<Attractor>;
    nodes: Array<Node>;
    index: KDBush<Node>;
    

    constructor(x0: number, y0: number, x1: number, y1: number) {
            this.x0    = x0;
            this.y0    = y0;
            this.x1    = x1;
            this.y1    = y1;
            this.attractors = [];
            this.nodes      = [];
            this.index      = new KDBush([]);
    }

    addNode(node: Node): void {
        this.nodes.push(node);
    }

    randomNodes(n: number): void {
        this.nodes = Node.getRandomList(n, this.x0, this.y0, this.x1, this.y1);
    }

    addAtractor(attractor: Attractor): void {
        this.attractors.push(attractor);
    }

    randomAttractors(n: number): void {
        this.attractors = Attractor.getRandomList(n, this.x0, this.y0, this.x1, this.y1);
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
        return this.index.within(
            a.position.x, a.position.y, distance
        ).map(id => this.nodes[id]);
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

    private nodeIsInsideRectangle(node: Node): boolean {
        return (node.position.x >= this.x0 && node.position.x <= this.x1 &&
            node.position.y >= this.y0 && node.position.y <= this.y1);
    }

    private growNewNodes(segmentLength: number): void {
        for (let node of this.nodes) {
            if (node.isAttracted()) {
                let newNode = this.getNextNode(node, segmentLength);
                if (this.nodeIsInsideRectangle(newNode)) {
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

}
