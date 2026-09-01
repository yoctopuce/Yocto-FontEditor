/*
 *   Yocto-FontEditor, a free web-based application
 *   to create .yfm font files for Yoctopuce displays
 *
 *  Adds a magnifier to a canvas
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
export class CanvasMagnifier
  {
    private rootCanvas: HTMLCanvasElement
    private magnifier: HTMLCanvasElement
    private magnifierCtx: CanvasRenderingContext2D | null
    private rootCanvasCtx: CanvasRenderingContext2D | null
    private static magnifierSize: number = 25;
    private static magnifierZoom: number = 4;

    constructor(rootCanvas: HTMLCanvasElement)
      {
        this.rootCanvas = rootCanvas;
        this.rootCanvas.style.cursor = "none"
        this.magnifier = document.createElement("canvas")
        this.magnifier.width = CanvasMagnifier.magnifierSize;
        this.magnifier.height = CanvasMagnifier.magnifierSize;
        this.magnifier.style.position = "absolute"
        this.magnifier.style.backgroundColor = "white"
        this.magnifier.style.border = "1px solid black"
        this.magnifier.style.borderRadius = "50%"
        this.magnifier.style.pointerEvents = "none"
        this.magnifier.style.display = "none"
        this.magnifier.style.imageRendering = "pixelated"
        this.magnifier.style.width = (CanvasMagnifier.magnifierSize * CanvasMagnifier.magnifierZoom).toString() + "px";
        this.magnifier.style.height = (CanvasMagnifier.magnifierSize * CanvasMagnifier.magnifierZoom).toString() + "px";
        document.body.appendChild(this.magnifier)
        this.magnifierCtx = this.magnifier.getContext("2d", {willReadFrequently: true});
        this.rootCanvasCtx = this.rootCanvas.getContext("2d", {willReadFrequently: true});
        this.rootCanvas.addEventListener("mousemove", (event: MouseEvent) => {this.onMouseMove(event)})
        this.rootCanvas.addEventListener("mouseover", (event: MouseEvent) => {this.onMouseOver(event)})
        this.rootCanvas.addEventListener("mouseout", (event: MouseEvent) => {this.onMouseOut(event)})
      }

    private onMouseOver(event: MouseEvent)
      {this.magnifier.style.display = ""}

    private onMouseOut(event: MouseEvent)
      {this.magnifier.style.display = "none"}

    private onMouseMove(event: MouseEvent)
      {
        let x: number = event.offsetX;
        let y: number = event.offsetY;
        let canvasScale: number = (this.rootCanvas.clientWidth) / this.rootCanvas.width;
        let zoom = CanvasMagnifier.magnifierZoom * canvasScale
        console.log("scale=" + canvasScale)
        x = x / canvasScale;
        y = y / canvasScale;
        let xPositionOnPage: number = event.pageX
        let yPositionOnPage: number = event.pageY
        let XX: number = Math.round(xPositionOnPage - CanvasMagnifier.magnifierSize * CanvasMagnifier.magnifierZoom / 2)
        let YY: number = Math.round(yPositionOnPage - CanvasMagnifier.magnifierSize * CanvasMagnifier.magnifierZoom / 2)
        this.magnifier.style.left = XX.toString() + "px";
        this.magnifier.style.top = YY.toString() + "px";
        if (this.magnifierCtx == null) return;
        if (this.rootCanvasCtx == null) return;
        this.magnifier.width = CanvasMagnifier.magnifierSize / canvasScale;
        this.magnifier.height = CanvasMagnifier.magnifierSize / canvasScale;
        let data = this.rootCanvasCtx.getImageData(Math.round(x - CanvasMagnifier.magnifierSize / (2 * canvasScale)), Math.round(y - CanvasMagnifier.magnifierSize / (2 * canvasScale)), CanvasMagnifier.magnifierSize / canvasScale, CanvasMagnifier.magnifierSize / canvasScale)
        this.magnifierCtx.putImageData(data, 0, 0)
        let borderSize: number = parseInt(this.rootCanvas.style.border)
        if (borderSize > 0)
          {
            let rx: number = Math.round(-x - Math.trunc(borderSize * canvasScale) + (CanvasMagnifier.magnifierSize / 2) - CanvasMagnifier.magnifierZoom / 2)
            let ry: number = Math.round(-y - Math.trunc(borderSize * canvasScale) + (CanvasMagnifier.magnifierSize / 2) - CanvasMagnifier.magnifierZoom / 2)
            let rw: number = this.rootCanvas.width
            let rh: number = this.rootCanvas.height
            let offset: number = -7 + 8 / canvasScale  // empirical 1
            let s = Math.trunc(10 * canvasScale); // empirical 2
            if (s == 5) offset = 13;
            if (s == 10) offset = 1;
            if (s == 20) offset = -3;
            if (s == 30) offset = -4;
            this.magnifierCtx.strokeStyle = 'black';
            this.magnifierCtx.lineWidth = 1; //borderSize * canvasScale;
            this.magnifierCtx.strokeRect(0.5 + offset + rx, 0.5 + offset + ry, rw, rh);
          }
      }
  }