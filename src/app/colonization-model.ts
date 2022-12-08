import { Attractor } from "./attractor";
import { Node } from "./node";
import KDBush from "kdbush";
import { randomVec2 } from "./util";
import Vec2 from "vec2";
import { Mask } from "./mask";

export enum ColonizationMode {
  Open   = "0",
  Closed = "1"
}

export class ColonizationModel {
  attractionRadius: number;
  absorptionRadius: number;
  stepLength:       number;

  attractors: Array<Attractor>;
  nodes: Array<Node>;
  attractorsIndex: KDBush<Attractor>;
  nodesIndex: KDBush<Node>;
  mask: Mask;
  mode: ColonizationMode;
  convex: boolean;
  disturbDirection: boolean;

  constructor(width: number = 1, height: number = 1, mask: Mask | undefined = undefined, mode: ColonizationMode = ColonizationMode.Open, convex: boolean = true, disturbDirection: boolean = false) {
    this.attractionRadius = 128;
    this.absorptionRadius = 16;
    this.stepLength       = 2;
    this.attractors = [];
    this.nodes      = [];
    this.nodesIndex      = new KDBush([]);
    this.attractorsIndex = new KDBush([]);
    if (mask != undefined) {
      this.mask = mask;
    }
    else {
      this.mask  = new Mask(width, height);
    }
    this.mode = mode;
    this.convex = convex;
    this.disturbDirection = disturbDirection;
  }

  update(mask: Mask) {
    // Move all points based on new coordinates
    let sw = mask.width / this.mask.width;
    let sh = mask.height / this.mask.height;
    for (let a of this.attractors) {
      a.position.multiply(sw, sh);
    }
    for (let n of this.nodes) {
      n.position.multiply(sw, sh);
    }
    this.mask = mask;
  }

  copyAttractors(attractors: Array<Attractor>) {
    this.attractors = [];
    for (let a of attractors) {
      const x = a.position.x;
      const y = a.position.y;
      let na = new Attractor();
      na.position = new Vec2(x, y);
      this.attractors.push(na);
    }
  }

  createNode(x: number, y: number): boolean {
    if (this.mask.at(x, y)) {
      if (!this.nodesIndex.within(x, y, 0).length) {
        let n = new Node();
        n.position = new Vec2(x, y);
        this.addNode(n);
        return true;
      }
    }
    return false;
  }

  private addNode(node: Node): void {
    this.nodes.push(node);
  }

  createAttractor(x: number, y: number): boolean {
    if (this.mask.at(x, y)) {
      const temp = this.attractorsIndex.within(x, y, 0);
      if (!temp.length) {
        let a = new Attractor();
        a.position = new Vec2(x, y);
        this.addAtractor(a);
        return true;
      }
    }
    return false;
  }

  private addAtractor(attractor: Attractor): void {
    this.attractors.push(attractor);
  }

  step(): boolean {
    this.updateIndex();
    switch (this.mode) {
      case ColonizationMode.Open:
        this.associateAttractorsToClosestNodes();
        break;
      case ColonizationMode.Closed:
        this.associateAttractorsToNodes();
        break;
      default:
        break;
      }
    const n = this.nodes.length;
    this.growNewNodes(this.stepLength);
    this.absorbAttractors(this.absorptionRadius);
    return this.nodes.length > n;
  }

  private updateIndex() {
    this.nodesIndex = new KDBush(this.nodes, n => n.position.x, n => n.position.y);
    this.attractorsIndex = new KDBush(this.attractors, p => p.position.x, p => p.position.y);
  }

  private associateAttractorsToClosestNodes(): void {
    for (let a of this.attractors) {
      let nodesInAttractionZone = this.getNodesWithinDistance(a, this.attractionRadius);
      let nodesInAbsorptionZone = this.getNodesWithinDistance(a, this.absorptionRadius);
      if (nodesInAbsorptionZone.length > 0) {
        a.reached = true;
      }
      let nodesToGrow = nodesInAttractionZone.filter(n => {
        return !nodesInAbsorptionZone.includes(n)
      });
      let closestNode = this.getClosestNodeToAttractor(a, nodesToGrow, this.attractionRadius);
      if (closestNode) {
        a.nodes = [closestNode];
        closestNode.attractors.push(a);
      }
    }
  }

  private getClosestNodeToAttractor(attractor: Attractor, nodes: Array<Node>, maxDistance: number): Node | null {
    let closestNode: Node | null = null;
    if (nodes.length > 0) {
      let minDistance = maxDistance;
      for (let n of nodes) {
        const tempDistance = attractor.position.distance(n.position);
        if (tempDistance < minDistance) {
          minDistance = tempDistance;
          closestNode = n;
        }
      }
    }
    return closestNode;
  }

  private associateAttractorsToNodes(): void {
    for (let a of this.attractors) {
      let nodesInNeighborhood = this.getRelativeNeighborNodes(a);
      let nodesInAbsorptionZone    = this.getNodesWithinDistance(a, this.absorptionRadius);
      let nodesToGrow         = nodesInNeighborhood.filter(n => {
        return !nodesInAbsorptionZone.includes(n)
      });
      a.nodes = nodesInNeighborhood;
      for (let n of nodesToGrow) {
        n.attractors.push(a);
      }
    }
  }

  private getNodesWithinDistance(a: Attractor, distance: number): Array<Node> {
    if (this.convex) {
      return this.getNodesWithinDistanceConvex(a, distance);
    }
    else {
      return this.getNodesWithinDistanceNonConvex(a, distance);
    }
  }

  private getNodesWithinDistanceNonConvex(a: Attractor, distance: number): Array<Node> {
    let result = [];
    let temp = this.nodesIndex.within(a.position.x, a.position.y, distance).map(id => this.nodes[id]);
    for (let n of temp) {
      if (this.segmentIsInside(a.position, n.position)) {
        result.push(n);
      }
    }
    return result;
  }

  private getNodesWithinDistanceConvex(a: Attractor, distance: number): Array<Node> {
    let result = [];
    let temp = this.nodesIndex.within(a.position.x, a.position.y, distance).map(id => this.nodes[id]);
    for (let n of temp) {
      result.push(n);
    }
    return result;
  }

  private segmentIsInside(p1: Vec2, p2: Vec2): boolean {
    let n = 4;
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

  private getRelativeNeighborNodes(a: Attractor): Array<Node> {
    let result = [];
    let nodesInAttractionZone = this.getNodesWithinDistance(a, this.attractionRadius);
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
            if (tempNode.parent.thickness < tempNode.thickness + .05) {
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
    if (this.disturbDirection) {
      let noise = randomVec2(-1, -1, 1, 1).normalize();
      r.add(noise);
    }
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

  private absorbAttractors(absorptionRadius: number) {
    for (let [iatt, att] of this.attractors.entries()) {
      let finished = false;
      if (att.reached) {
        finished = true;
      }
      else if (att.attracts()) {
        finished = true;
        for (let node of att.nodes) {
          if (att.position.distance(node.position) > absorptionRadius) {
            finished = false;
            break;
          }
        }
      }
      if (finished) {
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

  clearElements() {
    this.clearNodes();
    this.clearAttractors();
  }

  clearNodes() {
    this.nodes = [];
  }

  clearAttractors() {
    this.attractors = [];
  }
}
