/*
 *   Yocto-FontEditor, a free web-based application
 *   to create .yfm font files for Yoctopuce displays
 *
 *  editor's selections handling
 *
 *   - - - - - - - - - License information: - - - - - - - - -
 *
 *  Copyright (C) 2026 and beyond by Yoctopuce Sarl, Switzerland.
 *
 *  Yoctopuce Sarl (hereafter Licensor) grants to you a perpetual
 *  non-exclusive license to use, modify, copy and integrate this
 *  file into your software for the sole purpose of interfacing
 *  with Yoctopuce products.
 *
 *  You may reproduce and distribute copies of this file in
 *  source or object form, as long as the sole purpose of this
 *  code is to interface with Yoctopuce products. You must retain
 *  this notice in the distributed source file.
 *
 *  You should refer to Yoctopuce General Terms and Conditions
 *  for additional information regarding your rights and
 *  obligations.
 *
 *  THE SOFTWARE AND DOCUMENTATION ARE PROVIDED "AS IS" WITHOUT
 *  WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING
 *  WITHOUT LIMITATION, ANY WARRANTY OF MERCHANTABILITY, FITNESS
 *  FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. IN NO
 *  EVENT SHALL LICENSOR BE LIABLE FOR ANY INCIDENTAL, SPECIAL,
 *  INDIRECT OR CONSEQUENTIAL DAMAGES, LOST PROFITS OR LOST DATA,
 *  COST OF PROCUREMENT OF SUBSTITUTE GOODS, TECHNOLOGY OR
 *  SERVICES, ANY CLAIMS BY THIRD PARTIES (INCLUDING BUT NOT
 *  LIMITED TO ANY DEFENSE THEREOF), ANY CLAIMS FOR INDEMNITY OR
 *  CONTRIBUTION, OR OTHER SIMILAR COSTS, WHETHER ASSERTED ON THE
 *  BASIS OF CONTRACT, TORT (INCLUDING NEGLIGENCE), BREACH OF
 *  WARRANTY, OR OTHERWISE.
 */
export class GridSelection
  {
    private x1: number;
    private y1: number;
    private x2: number;
    private y2: number;
    private moveX0: number = 0;
    private moveY0: number = 0;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private moving: boolean = false;
    private isActive: boolean = true;
    private isCreating: boolean = false;
    private glyphData: ImageData | null = null
    private selectionAreaData: ImageData | null = null
    private data: ImageData | null = null

    constructor(x: number, y: number)
      {
        this.x1 = x;
        this.y1 = y;
        this.x2 = x;
        this.y2 = y;
      }

    public get x(): number {return this.offsetX + Math.min(this.x1, this.x2)};

    public get y(): number {return this.offsetY + Math.min(this.y1, this.y2)};

    public get width(): number {return 1 + Math.abs(this.x2 - this.x1)};

    public get height(): number {return 1 + Math.abs(this.y2 - this.y1)};

    public get backgroundData(): ImageData | null {return this.glyphData};

    public get selectionData(): ImageData | null {return this.selectionAreaData};

    public setBlack()
      {
        if (this.selectionAreaData == null) return;
        const w: number = this.selectionAreaData.width;
        const h: number = this.selectionAreaData.height;
        for (let i: number = 0; i < w; i++) for (let j: number = 0; j < h; j++)
          {
            let index1: number = 4 * (i + j * w)
            this.selectionAreaData.data[index1] = 0;
            this.selectionAreaData.data[index1 + 1] = 0;
            this.selectionAreaData.data[index1 + 2] = 0;
            this.selectionAreaData.data[index1 + 3] = 255;
          }
      }

    public changeGeometry(offsetLeft: number, offsetTop: number, offsetRight: number, offsetBottom: number)
      { if (this.glyphData==null) return;
         let canvas : HTMLCanvasElement = document.createElement("canvas")
         canvas.width =  this.glyphData.width+offsetLeft+offsetRight
         canvas.height =  this.glyphData.height+offsetTop+offsetRight
         let ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
         if (ctx==null) return
         ctx.putImageData(this.glyphData,offsetLeft,offsetTop)
         this.glyphData=ctx.getImageData(0,0, canvas.width,canvas.height )
         this.shift(offsetLeft,offsetTop)
         this.shiftCompleted()
      }
    public setWhite()
      {
        if (this.selectionAreaData == null) return;
        const w: number = this.selectionAreaData.width;
        const h: number = this.selectionAreaData.height;
        for (let i: number = 0; i < w; i++) for (let j: number = 0; j < h; j++)
          {
            let index1: number = 4 * (i + j * w)
            this.selectionAreaData.data[index1] = 0;
            this.selectionAreaData.data[index1 + 1] = 0;
            this.selectionAreaData.data[index1 + 2] = 0;
            this.selectionAreaData.data[index1 + 3] = 0;
          }
      }

    public colorReverse()
      {
        if (this.selectionAreaData == null) return;
        const w: number = this.selectionAreaData.width;
        const h: number = this.selectionAreaData.height;
        for (let i: number = 0; i < w; i++) for (let j: number = 0; j < h; j++)
          {
            let index: number = 4 * (i + j * w)
            let c: number = this.selectionAreaData.data[index + 3] > 0 ? 0 : 255;
            this.selectionAreaData.data[index] = 0;
            this.selectionAreaData.data[index + 1] = 0;
            this.selectionAreaData.data[index + 2] = 0;
            this.selectionAreaData.data[index + 3] = c;
          }
      }

    public set active(value: boolean) {this.isActive = value}

    public get active(): boolean {return this.isActive}

    public set creating(value: boolean) {this.isCreating = value}

    public get creating(): boolean {return this.isCreating}

    public hrzMirror()
      {
        if (this.selectionAreaData == null) return;
        const w: number = this.selectionAreaData.width;
        const h: number = this.selectionAreaData.height;
        for (let i: number = 0; i < w; i++) for (let j: number = 0; j < h / 2; j++)
          {
            let index1: number = 4 * (i + j * w)
            let index2: number = 4 * (i + (h - 1 - j) * w);
            let C1 = this.selectionAreaData.data[index1 + 3];
            let C2 = this.selectionAreaData.data[index2 + 3];
            this.selectionAreaData.data[index1] = C2;
            this.selectionAreaData.data[index2] = C1;
            this.selectionAreaData.data[index1 + 1] = C2;
            this.selectionAreaData.data[index2 + 1] = C1;
            this.selectionAreaData.data[index1 + 2] = C2;
            this.selectionAreaData.data[index2 + 2] = C1;
            C1 = this.selectionAreaData.data[index1 + 3];
            C2 = this.selectionAreaData.data[index2 + 3];
            this.selectionAreaData.data[index1 + 3] = C2;
            this.selectionAreaData.data[index2 + 3] = C1;
          }
      }

    public vrtMirror()
      {
        if (this.selectionAreaData == null) return;
        const w: number = this.selectionAreaData.width;
        const h: number = this.selectionAreaData.height;
        for (let j: number = 0; j < h; j++) for (let i: number = 0; i < w / 2; i++)
          {
            let index1: number = 4 * (i + j * w)
            let index2: number = 4 * ((w - 1 - i) + j * w);
            let C1 = this.selectionAreaData.data[index1];
            let C2 = this.selectionAreaData.data[index2];
            this.selectionAreaData.data[index1] = C2;
            this.selectionAreaData.data[index2] = C1;
            this.selectionAreaData.data[index1 + 1] = C2;
            this.selectionAreaData.data[index2 + 1] = C1;
            this.selectionAreaData.data[index1 + 2] = C2;
            this.selectionAreaData.data[index2 + 2] = C1;
            C1 = this.selectionAreaData.data[index1 + 3];
            C2 = this.selectionAreaData.data[index2 + 3];
            this.selectionAreaData.data[index1 + 3] = C2;
            this.selectionAreaData.data[index2 + 3] = C1;
          }
      }

    public setMoveOrigin(x: number, y: number)
      {
        this.moveX0 = x;
        this.moveY0 = y;
        this.moving = true;
      }

    public shift(x: number, y: number)
      {
        this.offsetX = x - this.moveX0;
        this.offsetY = y - this.moveY0;
      }

    public shiftCompleted()
      {
        this.x1 += this.offsetX
        this.x2 += this.offsetX
        this.y1 += this.offsetY
        this.y2 += this.offsetY
        this.offsetX = 0;
        this.offsetY = 0;
      }

    public get isMoving() {return this.moving}

    public setZoneData(glyphData: ImageData | null, selectionData: ImageData | null = null)
      {
        this.glyphData = glyphData
        if (selectionData != null) this.selectionAreaData = selectionData
      }

    public get selectionZoneData(): ImageData | null
      {
        return this.selectionAreaData
      }

    public get glyphZoneData(): ImageData | null
      {
        return this.glyphData
      }

    public isInside(x: number, y: number): boolean
      {
        return (x >= this.x) && (x < this.x + this.width) && (y >= this.y) && (y < this.y + this.height);
      }

    public setCorner(x: number, y: number)
      {
        this.x2 = x;
        this.y2 = y;
      }
  }