import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ColonizationModel } from '../colonization-model';
import { Node } from '../node';
import { Attractor } from '../attractor';
import { sleep } from '../util';
import Vec2 from 'vec2';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})

export class MainComponent implements AfterViewInit {
  @ViewChild('canvas')
  private canvasRef!: ElementRef;
  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }
  model!: ColonizationModel;

  numAttractors: number = 250;
  numNodes: number = 1;
  attractionDistance: number = 128;
  pruneDistance: number = 16; 
  segmentLength: number = 2;
  
  showAttractionZone: boolean = true;
  showPruneZone: boolean = true;
  isRunning: boolean = false;

  randomAttractors: boolean = false;

  
  constructor() {
  }

  ngAfterViewInit(): void {
    this.setup();
    this.drawScene();
  }

  draw(event: Event): void {
    if (!this.isRunning) {
      this.drawScene();
    }
  }

  private drawScene(): void {
    this.drawBackground();
    this.drawAttractors();
    this.drawSegments();
  }

  private drawBackground() {
    const ctx = this.canvas.getContext('2d');
    if (ctx != null) {
      ctx.beginPath();
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.closePath();
    }
  }

  private drawAttractors(): void {
    for (let a of this.model.attractors) {
      this.drawAttractor(a);
    }
  }

  private drawAttractor(a: Attractor): void {
    const ctx = this.canvas.getContext('2d');
    if (ctx != null) {
      if (this.showAttractionZone) {
        ctx.beginPath();
        ctx.ellipse(a.position.x, a.position.y, this.attractionDistance, this.attractionDistance, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'green';
        ctx.stroke();
        ctx.closePath();
      }
      if (this.showPruneZone) {
        ctx.beginPath();
        ctx.ellipse(a.position.x, a.position.y, this.pruneDistance, this.pruneDistance, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'red';
        ctx.stroke();
        ctx.closePath();
      }
    }
  }

  private drawSegments(): void {
    for (let node of this.model.nodes) {
      if (!this.isRunning) {
        this.drawNode(node);
      }
      this.drawNode(node);
    }
  }
  
  private drawNode(node: Node): void {
    const ctx = this.canvas.getContext('2d');
    if (ctx != null) {
      ctx.beginPath();
      ctx.ellipse(node.position.x, node.position.y, (1 + node.thickness) / 2, (1 + node.thickness) / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'black';
      ctx.closePath();
      ctx.fill();
      if (node.parent != undefined) {
        // Draw segment between node and node.parent
        ctx.moveTo(node.position.x, node.position.y);
        ctx.lineTo(node.parent.position.x, node.parent.position.y);
        ctx.lineWidth = 1 + node.parent.thickness;
        //ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.closePath();
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }
  }

  public clickResetButton(event: Event) {
    this.setup();
    this.drawScene();
  }

  public async clickGoButton(event: Event) {
    this.isRunning = true;
    await this.run();
    this.isRunning = false;
  }
  
  private setup(): void {
    this.fixCanvasSize();
    this.model = new ColonizationModel(1, 1, this.canvas.width, this.canvas.height);
  }

  private fixCanvasSize(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    // If it's resolution does not match change it
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  async run(): Promise<void> {
    while (true) {
      this.drawScene();
      if (!this.model.step(this.attractionDistance, this.pruneDistance, this.segmentLength)) {
        break;
      }
      await sleep(0);
    }
    this.drawScene();
    console.log("DONE!");
  }

  createNewAttractor(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let a = new Attractor();
    a.position = new Vec2(x, y);
    this.model.addAtractor(a);
    this.drawScene();
  }

  createNewNode(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let n = new Node();
    n.position = new Vec2(x, y);
    this.model.addNode(n);
    this.drawScene();
  }

  contextMenu(event: Event): boolean {
    return false;
  }

  generateRandomAttractors(event: Event) {
    this.model.attractors = Attractor.getRandomList(this.numAttractors,
      this.model.x0, this.model.y0, this.model.x1, this.model.y1);
    this.drawScene();
  }

  generateRandomNodes(event: Event) {
    this.model.nodes = Node.getRandomList(this.numNodes,
      this.model.x0, this.model.y0, this.model.x1, this.model.y1);
    this.drawScene();
  }
}
