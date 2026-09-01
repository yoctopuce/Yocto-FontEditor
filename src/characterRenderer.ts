/*
 *   Yocto-FontEditor, a free web-based application
 *   to create .yfm font files for Yoctopuce displays
 *
 *  Character and character set rendered
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
import {GridSelection} from "./selection.js";

export class YfmtFileHeader
  {
    private _bitmapWidth: number = 0
    private _charHeight: number = 0
    private _baseline: number = 0
    private _firstChar: number = 0
    private _lastChar: number = 0
    private _charCount: number = 0
    private _error: string = ""

    public get bitmapWidth() {return this._bitmapWidth}

    public get charHeight() {return this._charHeight}

    public get baseline() {return this._baseline}

    public get firstChar() {return this._firstChar}

    public get lastChar() {return this._lastChar}

    public get charCount() {return this._charCount}

    public get error() {return this._error}

    public get fileOk(): boolean {return this._error == ""}

    constructor(data: Uint8Array)
      {
        this._error = "";
        if (data.length < 10)
          {
            this._error = "File is too short";
            return
          }
        if ((data[0] != 0x59) || (data[1] != 0x46))
          {
            this._error = "Not a proper Yoctopuce font file";
            return
          }
        if ((data[2] != 0x01))
          {
            this._error = "Unsupported version";
            return
          }
        if ((data[3] != 0x01))
          {
            this._error = "Unsupported bpp";
            return
          }
        this._bitmapWidth = data[4] + 256 * data[5]
        this._charHeight = data[6];
        this._baseline = data[7]
        this._firstChar = data[8]
        this._lastChar = data[9]
        if (this._lastChar < this._firstChar)
          {
            this._error = "invalid data";
            return
          }
        this._charCount = (this._lastChar - this._firstChar + 1)
        let expectedFileLength = 0x0A + 2 * this._charCount + this._charHeight * (this._bitmapWidth / 8)
        if (expectedFileLength != data.length)
          {
            this._error = "Invalid file length";
            return
          }
      }
  }

export class CharacterRenderer
  {
    internalcanvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null;
    zoomLevel: number = 1;
    asccicode: number = 0;

    constructor(fontdef: string, width: number, height: number, yOffset: number, character: string, pixelCount: number[] | null = null, blackPixelCount: number[] | null = null, antiAliasingFilter: number = 128, fillStroke: number = 1, outlineWidth: number = 0)
      {
        this.asccicode = character.charCodeAt(0);
        this.internalcanvas = document.createElement('canvas')
        this.internalcanvas.style.border = "1px solid #d0d0d0"
        this.internalcanvas.width = width
        this.internalcanvas.height = height
        this.internalcanvas.style.imageRendering = "pixelated"
        this.ctx = this.internalcanvas.getContext("2d", {willReadFrequently: true})
        if (this.ctx == null) throw new RangeError("Unable to  get Canvas context")
        if (fontdef == "") return;
        // we are drawing the character in a slightly larger canvas since
        // the Browser's textwidth calculation are sometime a bit off
        const tmpwidth: number = width + Math.ceil(height / 10);
        let tmpCanvas: HTMLCanvasElement = document.createElement('canvas')
        tmpCanvas.style.border = "1px solid #d0d0d0"
        tmpCanvas.width = tmpwidth
        tmpCanvas.height = height
        tmpCanvas.style.imageRendering = "pixelated"
        //tmpCanvas.style.position="absolute"
        //tmpCanvas.style.left= (10 + (25* (this.asccicode-32))).toString()+"px"
        //tmpCanvas.style.top="50px"
        //tmpCanvas.style.backgroundColor="pink"
        //document.body.appendChild(tmpCanvas)
        let tmpctx: CanvasRenderingContext2D | null = tmpCanvas.getContext("2d", {willReadFrequently: true})
        if (tmpctx == null) throw new RangeError("Unable to  get Canvas context")
        tmpctx.textBaseline = "top";
        tmpctx.font = fontdef
        tmpctx.fillStyle = "black";
        tmpctx.lineWidth = outlineWidth;
        if (fillStroke & 1) tmpctx.fillText(character, 0, yOffset)
        if (fillStroke & 2) tmpctx.strokeText(character, 0, yOffset)
        const imageData: ImageData = tmpctx.getImageData(0, 0, tmpwidth, height);
        let maxX: number = width - 1;
        for (let j: number = 0; j < height; j++)
          {
            for (let i: number = 0; i < tmpwidth; i++)
              {
                const index = (i + j * tmpwidth) * 4;
                if (imageData.data[index + 3] >= antiAliasingFilter)
                  {
                    if (blackPixelCount != null) blackPixelCount[j]++;
                    imageData.data[index] = 0
                    imageData.data[index + 1] = 0
                    imageData.data[index + 2] = 0
                    imageData.data[index + 3] = 255
                    if (i > maxX) maxX = i
                  } else
                  {
                    imageData.data[index] = 255
                    imageData.data[index + 1] = 255
                    imageData.data[index + 2] = 255
                    imageData.data[index + 3] = 0
                  }
              }
          }
        this.internalcanvas.width = maxX + 1
        if (pixelCount != null) for (let j: number = 0; j < height; j++) pixelCount[j] += this.internalcanvas.width;
        this.ctx = this.internalcanvas.getContext("2d", {willReadFrequently: true})
        if (this.ctx == null) throw new RangeError("Unable to  get Canvas context")
        this.ctx.putImageData(imageData, 0, 0)
      }

    public get ascii() {return this.asccicode}

    public getDataZone(x: number, y: number, width: number, height: number)
      {
        // @ts-ignore
        return this.ctx.getImageData(x, y, width, height);
      }

    public clone(): CharacterRenderer | null
      {
        let it: CharacterRenderer = new CharacterRenderer("", this.internalcanvas.width, this.internalcanvas.height, 0, '')
        let data: ImageData | null = this.getContents()
        if (data == null) return null;
        it.update(data)
        it.setZoom(this.zoomLevel)
        return it;
      }

    public update(contents: ImageData, verticalOffset: number = 0)
      {
        if (this.ctx == null) return;
        this.ctx.putImageData(contents, 0, verticalOffset)
      }

    public updateWidthSelection(selection: GridSelection)
      {
        if (this.ctx == null) return;
        let background: ImageData | null = selection.backgroundData;
        let foreground: ImageData | null = selection.selectionData;
        if ((background == null) || (foreground == null)) return
        this.ctx.putImageData(background, 0, 0)
        this.ctx.putImageData(foreground, selection.x, selection.y)
      }

    public getContents(): ImageData | null
      {
        if (this.ctx == null) return null;
        return this.ctx.getImageData(0, 0, this.internalcanvas.width, this.internalcanvas.height);
      }

    public setContents(data: ImageData)
      {
        if (this.ctx == null) return null;
        return this.ctx.putImageData(data, 0, 0);
      }

    public draw(canvas: HTMLCanvasElement, x: number, y: number, color: [number, number, number])
      {
        let w: number = this.internalcanvas.width;
        let h: number = this.internalcanvas.height;
        if (this.ctx == null) return
        let r: number = color[0];
        let g: number = color[1];
        let b: number = color[2];
        let img: ImageData = this.ctx.getImageData(0, 0, w, h);
        for (let i = 0; i < w * h; i++)
          {
            if (img.data[3 + 4 * i] == 255)
              {
                img.data[4 * i] = r;
                img.data[1 + 4 * i] = g;
                img.data[2 + 4 * i] = b;
              }
          }
        let target: CanvasRenderingContext2D | null = canvas.getContext("2d", {willReadFrequently: true})
        if (target == null) throw new RangeError("Unable to  get target Canvas context")
        target.putImageData(img, x, y);
      }

    public setZoom(scaleFactor: number)
      {
        this.zoomLevel = scaleFactor;
        if (this.ctx == null) return;
        let scale: number = scaleFactor
        if (scale <= 0) scale = 1 / (-scale + 2);
        this.internalcanvas.style.width = (scale * this.internalcanvas.width).toString() + "px";
        this.internalcanvas.style.height = (scale * this.internalcanvas.height).toString() + "px";
      }

    public setWidth(w: number)
      {
        this.canvas.width = w;
      }

    public changeGeometry(offsetLeft: number, offsetTop: number, offsetRight: number, offsetBottom: number): boolean
      {
        if (this.ctx == null) return false;
        if (((offsetLeft < 0) || (offsetRight < 0)) && (this.canvas.width <= 1)) return false
        if (((offsetTop < 0) || (offsetBottom < 0)) && (this.canvas.height <= 1)) return false
        if (((offsetTop > 0) || (offsetBottom > 0)) && (this.canvas.height >= 255)) return false
        const imageData: ImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.width = this.canvas.width + offsetLeft + offsetRight;
        this.canvas.style.width = this.canvas.width.toString() + "px"
        this.canvas.height = this.canvas.height + offsetTop + offsetBottom;
        this.canvas.style.height = this.canvas.height.toString() + "px"
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.putImageData(imageData, offsetLeft, offsetTop)
        return true;
      }

    public addRowOnTop(): boolean { return this.changeGeometry(0, 1, 0, 0)}

    public removeRowFromTop(): boolean { return this.changeGeometry(0, -1, 0, 0)}

    public addRowOnBottom(): boolean { return this.changeGeometry(0, 0, 0, 1)}

    public removeRowFromBottom(): boolean { return this.changeGeometry(0, 0, 0, -1)}

    public addColOnleft(): boolean { return this.changeGeometry(1, 0, 0, 0)}

    public removeColFromleft(): boolean { return this.changeGeometry(-1, 0, 0, 0)}

    public addColOnRight(): boolean { return this.changeGeometry(0, 0, 1, 0)}

    public removeColFromright(): boolean { return this.changeGeometry(0, 0, -1, 0)}

    public get canvas(): HTMLCanvasElement { return this.internalcanvas;}

    public get width(): number {return this.internalcanvas.width; }

    public get height(): number {return this.internalcanvas.height; }

    public get imageData(): ImageData
      {
        let ctx: CanvasRenderingContext2D | null = this.internalcanvas.getContext("2d", {willReadFrequently: true})
        if (ctx == null) throw new RangeError("Unable to  get Canvas context")
        return ctx.getImageData(0, 0, this.internalcanvas.width, this.internalcanvas.height);
      }
  }

export class CharacterSetRenderer
  {
    charList: (CharacterRenderer | null)[];
    zoomLevel: number = 1;
    _baseline: number = 0;
    _generalHeight: number = 8;

    constructor()
      {
        this.charList = [];
        for (let i = 0; i < 256; i++) this.charList.push(null)
      }

    public get baseline() {return this._baseline};

    public set baseline(value)
      {
        this._baseline = value;
        if (this._baseline < 0) this._baseline = 0;
        if (this._baseline > this._generalHeight) this._baseline = this._generalHeight;
      };

    public get height() {return this._generalHeight }

    public addRowOnTop()
      {
        if (this._generalHeight >= 255) return;
        this._generalHeight++;
        for (let i = 0; i < this.charList.length; i++) if (this.charList[i] != null)
          { // @ts-ignore
            this.charList[i].addRowOnTop()
          }
      }

    public removeRowFromTop()
      {
        if (this._generalHeight <= 2) return;
        this._generalHeight++;
        for (let i = 0; i < this.charList.length; i++) if (this.charList[i] != null)
          { // @ts-ignore
            this.charList[i].removeRowFromTop()
          }
      }

    public addRowOnBottom()
      {
        if (this._generalHeight >= 255) return;
        this._generalHeight++;
        for (let i = 0; i < this.charList.length; i++) if (this.charList[i] != null)
          { // @ts-ignore
            this.charList[i].addRowOnBottom()
          }
        this._baseline++;
      }

    public removeRowFromBottom()
      {
        if (this._generalHeight <= 1) return;
        this._generalHeight++;
        for (let i = 0; i < this.charList.length; i++) if (this.charList[i] != null)
          { // @ts-ignore
            this.charList[i].removeRowFromBottom()
          }
        if (this._baseline > 0) this._baseline--;
      }

    public get_YFm_data(): Uint8Array | null
      {
        let first: number = -1;
        let last: number = -1;
        for (let i = 0; i < this.charList.length; i++) if (this.charList[i] != null)
          {
            if (first < 0) first = i;
            last = i;
          }
        if (first < 0) return null;
        // @ts-ignore
        let height: number = this.charList[first].height
        if (height > 255) return null //  just in case
        let totalwidth: number = 0;
        let xx: Uint16Array = new Uint16Array(last - first + 1)
        let n: number = 0;
        for (let i: number = first; i <= last; i++)
          {
            if (this.charList[i] != null)
              { // @ts-ignore
                totalwidth += this.charList[i].width;
              }
            xx[n++] = totalwidth > 0 ? totalwidth - 1 : 0;
          }
        totalwidth = 16 * (1 + ((totalwidth - 1) >> 4))
        let res: Uint8Array = new Uint8Array(10 + 2 * (last - first + 1) + height * totalwidth / 8).fill(0)
        res[0] = 0x59;
        res[1] = 0x46;  // signature ("YF" 0x4659, little endian )
        res[2] = 1; // version
        res[3] = 1; // bits per pixels
        res[4] = totalwidth & 0xff;
        res[5] = (totalwidth >> 8) & 0xff; // bitmap width
        res[6] = height;   // bitmap height
        res[7] = this._baseline; // Base line (starting from the bottom)
        res[8] = first;    // first defined character
        res[9] = last;     // last defined character
        n = 10;
        for (let i: number = 0; i < xx.length; i++)  // Coordinates of the last column of each character (little endian)
          {
            res[n++] = xx[i] & 0xff;
            res[n++] = xx[i] >> 8;
          }
        let Xoffset: number = 0;
        let lineSize: number = totalwidth >> 3;
        for (let char: number = first; char <= last; char++) if (this.charList[char] != null)
          { // @ts-ignore
            let w: number = this.charList[char].width;
            // @ts-ignore
            let h: number = this.charList[char].height;
            // @ts-ignore
            let bitmap: ImageData = this.charList[char].imageData
            for (let j: number = 0; j < h; j++) for (let i: number = 0; i < w; i++) if (bitmap.data[3 + 4 * (i + w * j)] == 255)
              {
                let offset: number = n + (lineSize * j) + ((Xoffset + i) >> 3)
                res[offset] |= 0x80 >> (((Xoffset + i) % 8))
              }
            Xoffset += w;
          }
        return res;
      }

    public setZoomLevel(scaleFactor: number)
      {
        this.zoomLevel = scaleFactor
        for (let i: number = 0; i < this.charList.length; i++) if (this.charList[i] != null)
          { // @ts-ignore
            this.charList[i].setZoom(this.zoomLevel)
          }
      }

    public removeCharacter(asciiCode: number)
      {
        if (asciiCode < 0) return;
        if (asciiCode > 255) return;
        this.charList[asciiCode] = null;
      }

    public newCharacter(asciiCode: number, width: number | null = null): CharacterRenderer
      {
        let w: number = 8;
        let total: number = 0;
        let count: number = 0;
        if (width != null)
          {w = width } else
          {
            for (let i: number = 0; i < this.charList.length; i++) if (this.charList[i] != null)
              { // @ts-ignore
                total += this.charList[i].width;
                count++;
              }
            if (count > 0) w = Math.round(total / count);
            if (w < 3) w = 3;
          }
        let c: CharacterRenderer | null = new CharacterRenderer("", w, this._generalHeight, 0, String.fromCharCode(asciiCode));
        if (c == null) throw  new RangeError("Cannot create character")
        this.charList[asciiCode] = c
        return c;
      }

    public importFromYfmData(data: Uint8Array)
      {
        let errormsg = "Cannot load YFM file : "
        let header: YfmtFileHeader = new YfmtFileHeader(data)
        if (!header.fileOk) throw new Error(errormsg + header.error)
        let body = document.getElementById('body') as HTMLElement;
        let canvas: HTMLCanvasElement = document.createElement('canvas');
        canvas.style.display = "none";
        canvas.style.position = "absolute"
        canvas.style.left = "100px"
        canvas.style.top = "100px"
        canvas.style.border = "1px solid red"
        canvas.width = header.bitmapWidth;
        canvas.height = header.charHeight;
        body.appendChild(canvas)
        this._generalHeight = header.charHeight;
        this._baseline = header.baseline;
        let ctx: CanvasRenderingContext2D | null = canvas.getContext("2d", {willReadFrequently: true})
        if (ctx == null) throw new Error(errormsg + " internal ctx error")
        let buffer: ImageData = ctx.getImageData(0, 0, header.bitmapWidth, header.charHeight)
        const first: number = 0x0A + 2 * header.charCount;
        const last: number = data.length
        let x: number = 0
        let y: number = 0
        let index: number = 0
        for (let i: number = first; i <= last; i++)
          {
            let c: number = data[i];
            if (c & 1) buffer.data[index + 31] = 255;
            if (c & 2) buffer.data[index + 27] = 255;
            if (c & 4) buffer.data[index + 23] = 255;
            if (c & 8) buffer.data[index + 19] = 255;
            if (c & 16) buffer.data[index + 15] = 255;
            if (c & 32) buffer.data[index + 11] = 255;
            if (c & 64) buffer.data[index + 7] = 255;
            if (c & 128) buffer.data[index + 3] = 255;
            index += 4 * 8;
            x += 8
            if (x >= header.bitmapWidth)
              {
                x = 0;
                y += 1
              }
          }
        ctx.putImageData(buffer, 0, 0)
        for (let i: number = 0; i < header.firstChar; i++) this.charList[i] = null;
        x = 0;
        index = 0x0A;
        let lastOffset: number = -1
        let charwidth: number = 0
        let offset: number = 0;
        for (let ascii: number = header.firstChar; ascii <= header.lastChar; ascii++)
          {
            offset = data[index] + 256 * data[index + 1]
            charwidth = offset - lastOffset;
            lastOffset = offset;
            index += 2
            if (charwidth > 0)
              {
                this.charList[ascii] = new CharacterRenderer("", charwidth, header.charHeight, 0, String.fromCharCode(ascii))
                let buffer: ImageData = ctx.getImageData(x, 0, charwidth, header.charHeight)
                this.charList[ascii]?.setContents(buffer)
                this.charList[ascii]?.setZoom(this.zoomLevel)
                x += charwidth
              } else this.charList[ascii] = null;
          }
        for (let i: number = header.lastChar + 1; i < 256; i++) this.charList[i] = null;
        this._baseline = header.baseline;
        body.removeChild(canvas)
      }

    public initFromScratch(first: number, last: number, width: number, height: number)
      {
        for (let i: number = 0; i < 255; i++)
          {
            if ((i < first) || (i > last)) this.charList[i] = null; else this.charList[i] = new CharacterRenderer("", width, height, 0, String.fromCharCode(i))
          }
        this._baseline = 1;
      }

    public async importFromFont(fontName: string, fontSizeInPx: number, firstchar: number, lastchar: number, antiAliasingFilter: number, fillStroke: number, outlineWidth: number)
      {
        let body = document.getElementById('body') as HTMLElement;
        let canvas: HTMLCanvasElement = document.createElement('canvas');
        let ctx: CanvasRenderingContext2D | null = canvas.getContext("2d", {willReadFrequently: true})
        if (ctx == null) throw new RangeError("Unable to  get Canvas context")
        let sampletext: string = ""
        for (let i: number = firstchar; i <= lastchar; i++)
          {
            sampletext = sampletext + String.fromCharCode(i);
          }
        let fontdef: string = fontSizeInPx + "px " + fontName;
        ctx.textBaseline = "top";
        ctx.font = fontdef;
        ctx.fillStyle = "black";
        ctx.lineWidth = outlineWidth;
        let textsize: TextMetrics = ctx.measureText(sampletext)
        let height: number = Math.ceil(Math.abs(textsize.actualBoundingBoxAscent) + Math.abs(textsize.actualBoundingBoxDescent))
        let width: number = Math.ceil(textsize.width);
        let delta: number = Math.ceil(height * 0.15)  // extra margin to catch pixels out of the therorical bounding
                                                      // box in some fancy fonts (MV Boli)
        height = (height + 2 * delta)
        //canvas.style.position="absolute"
        //canvas.style.backgroundColor="yellow"
        //canvas.style.left="10px"
        //canvas.style.top="10x"
        //body.appendChild(canvas)
        canvas.height = height
        canvas.width = width
        ctx = canvas.getContext("2d", {willReadFrequently: true})
        if (ctx == null) throw new RangeError("Unable to  get Canvas context")
        ctx.textBaseline = "top";
        ctx.font = fontdef;
        ctx.fillStyle = "black";
        ctx.lineWidth = outlineWidth;
        if (fillStroke & 2) ctx.strokeText(sampletext, 0, delta)
        if (fillStroke & 1) ctx.fillText(sampletext, 0, delta)
        //document.body.appendChild(canvas)
        let contents: ImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        let ofsetTop: number = delta;
        let ofsetBottom: number = delta;
        // search for stray pixels in the top extra space
        let index: number = 0;
        let max: number = 4 * (contents.width * delta)
        while ((contents.data[index + 3] < antiAliasingFilter) && (index < max)) index += 4;
        ofsetTop = Math.floor(index / (contents.width * 4))
        // search for stray pixels in the bottom extra space
        max = 4 * (contents.width * (contents.height - delta))
        index = 4 * (contents.width * contents.height - 1);
        while ((contents.data[index + 3] < antiAliasingFilter) && (index > max)) index -= 4;
        ofsetBottom = contents.height - Math.floor(index / (contents.width * 4))
        console.log("offsetTop= " + ofsetTop + "/" + delta)
        console.log("offsetBot= " + ofsetBottom + "/" + delta)
        this._generalHeight = height - ofsetTop - ofsetBottom;
        let pixelcount: number[] = new Array(height).fill(0);
        let blackpixelcount: number[] = new Array(height).fill(0);
        // sample all characters
        ctx.textBaseline = "top";
        this.charList = [];
        for (let i: number = 0; i < firstchar; i++) this.charList.push(null);
        for (let i: number = firstchar; i <= lastchar; i++)
          {
            let c: string = String.fromCharCode(i);
            let textsize: TextMetrics = ctx.measureText(c)
            let width = Math.ceil(textsize.width);
            if (width > 0) this.charList.push(new CharacterRenderer(fontdef, Math.ceil(textsize.width), this._generalHeight, delta - ofsetTop, c, pixelcount, blackpixelcount, antiAliasingFilter, fillStroke, outlineWidth)); else this.charList.push(null);
          }
        for (let i: number = lastchar; i < 256; i++) this.charList.push(null);
        // find out base line empirically  (TextMetrics.alphabeticBaseline doesn't exist on old browser)
        this._baseline = Math.round(this.height / 4);
        for (let j: number = 0; j < height; j++)
          {
            if (blackpixelcount[j] / pixelcount[j] > 0.1) this._baseline = this._generalHeight - j - 1;
          }
        if (this._baseline < 0) this._baseline = 0;
      }

    public getCharacter(asciiCode: number): CharacterRenderer | null
      {
        if ((asciiCode < 0) || (asciiCode > 255)) throw new RangeError("invalid ASCII code(" + asciiCode + ")");
        return this.charList[asciiCode]
      }
  }



