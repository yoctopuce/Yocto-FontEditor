/*
 *   Yocto-FontEditor, a free web-based application
 *   to create .yfm font files for Yoctopuce displays
 *
 *  user interface for preview part
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
import {Const} from './constants.js'
import {UserInterfacePanel} from './uipanel.js'
import {CharacterChooser} from './chooser.js';
import {Button, ImgButton} from "./button.js";
import {ressources} from "./ressources.js";
import {YAPI, YErrorMsg, YModule} from "./yoctolib/yocto_api.js";
import {YDisplay, YDisplayLayer} from "./yoctolib/yocto_display.js";
import {TimeMachine} from "./timemachine.js";
import {CanvasMagnifier} from "./canvasMagnifier.js";

enum COLORSCHEME
  {
    OLED = 1, ePaper
  }

enum ORIENTATION
  {
    PAYSAGE = 1, PORTRAIT
  }

class preViewStyleElement
  {
    protected element: HTMLOptionElement;
    protected type: COLORSCHEME;
    protected width: number
    protected height: number;
    protected orientation: ORIENTATION = ORIENTATION.PAYSAGE;

    constructor(containerlist: preViewStyleElement[], type: COLORSCHEME, width: number, height: number)
      {
        this.element = document.createElement("option")
        this.type = type;
        this.width = width
        this.height = height
        this.element.text = (this.type == COLORSCHEME.OLED ? "OLED" : "ePaper") + " " + this.width + "x" + this.height
        containerlist.push(this).toString()
        this.element.value = (containerlist.length - 1).toString();
      }

    public get htmlElement(): HTMLOptionElement {return this.element}

    public async setOrientation(value: ORIENTATION) { this.orientation = value; }

    public get displayType(): COLORSCHEME {return this.type}

    public get displayWidth(): COLORSCHEME {return this.width}

    public get displayHeight(): COLORSCHEME {return this.height}

    public get displayorientation(): ORIENTATION {return this.orientation}

    public get isEmulation(): boolean {return true}

    public machesDevice(seriaL: string) {return false}
  }

class preViewStyleElementHWD extends preViewStyleElement
  {
    private display: YDisplay | null = null;
    private name: string = "";
    private ongoingRefresh: NodeJS.Timeout | null = null;
    private refreshRunning: boolean = false;
    private serial: string = "";

    public async init(display: YDisplay)
      {
        this.serial = await display.get_serialNumber();
        this.display = display;
        this.name = await this.display.get_serialNumber() + ".display";
        let displaytype: YDisplay.DISPLAYTYPE = await display.get_displayType()
        this.type = displaytype == YDisplay.DISPLAYTYPE_MONO ? COLORSCHEME.OLED : COLORSCHEME.ePaper;
        await this.readHwdDisplayConfiguration();
      }

    public wentOffline()
      {
        this.element.text = this.serial + ".display (offline)";
      }

    public machesDevice(serial: string) {return this.serial == serial}

    public get isEmulation(): boolean {return false}

    private async readHwdDisplayConfiguration()
      {
        if (this.display == null) return;
        if (!await this.display.isOnline()) return
        let w: number = await this.display.get_displayWidth();
        let h: number = await this.display.get_displayHeight();
        let orientation: number = await this.display.get_orientation();
        switch (orientation)
          {
            case YDisplay.ORIENTATION_LEFT  :
            case YDisplay.ORIENTATION_RIGHT :
              this.orientation = ORIENTATION.PAYSAGE;
              this.width = w;
              this.height = h;
              break;
            case YDisplay.ORIENTATION_UP :
            case YDisplay.ORIENTATION_DOWN :
              this.orientation = ORIENTATION.PORTRAIT;
              this.width = h;
              this.height = w;
              break;
          }
        let fname: string = await this.display.get_friendlyName();
        this.element.text = fname + " (" + this.width.toString() + "x" + this.height.toString() + ")"
      }

    public async fullRefresh()
      {
        if (this.display == null) return;
        if (!await this.display.isOnline()) return
        await this.readHwdDisplayConfiguration();
      }

    public matches(name: string): boolean
      {
        return this.name == name
      }

    public async setOrientation(value: ORIENTATION)
      {
        if (this.display == null) return;
        if (!await this.display.isOnline()) return
        this.orientation = value;
        switch (this.orientation)
          {
            case ORIENTATION.PORTRAIT:
              await this.display.set_orientation(YDisplay.ORIENTATION_UP);
              break;
            case ORIENTATION.PAYSAGE:
              await this.display.set_orientation(YDisplay.ORIENTATION_LEFT);
              break;
          }
      }

    public async resetHwdDisplay()
      {
        if (this.display == null) return
        if (!this.display.isOnline()) return
        await this.display.resetAll();
        await this.display.regenerateDisplay();
      }

    private retrylater(todraw: HTMLCanvasElement, errDiv: HTMLDivElement, timeout: number = 250): number
      {
        if (this.ongoingRefresh != null) clearTimeout(this.ongoingRefresh)
        this.ongoingRefresh = setTimeout(() => { this.refreshHwdDisplay(todraw, errDiv) }, timeout);
        return 0
      }

    public async refreshHwdDisplay(todraw: HTMLCanvasElement, errDiv: HTMLDivElement): Promise<number>
      {
        console.log("refreshHwdDisplay");
        let ctx = todraw.getContext("2d", {willReadFrequently: true});
        if (ctx == null)
          {
            errDiv.innerText = "failed to get ctx";
            return 0
          }
        if (this.display == null)
          {
            errDiv.innerText = "display is null";
            return 0
          }
        let bitsPerPixel: number = 1;
        if (await this.display.get_userData() == null)
          {
            let t: YDisplay.DISPLAYTYPE = await this.display.get_displayType()
            bitsPerPixel = 1;
            if ((t == YDisplay.DISPLAYTYPE_EPAPER_BWR) || (t == YDisplay.DISPLAYTYPE_EPAPER_BWRY)) bitsPerPixel = 2;
            await this.display.set_userData(bitsPerPixel)
          } else bitsPerPixel = await this.display.get_userData() as number;
        if (!(await this.display.isOnline()))
          {
            errDiv.innerText = "Display module is offline";
            return 0
          }
        let errmsg: YErrorMsg = new YErrorMsg();
        let state: YDisplay.DISPLAYSTATE = await (this.display.get_ePaperState(errmsg))
        switch (state)
          {
            case YDisplay.DISPLAYSTATE.REFRESHING:
              console.log("display is busy at refreshing itself, will retry later on");
              return this.retrylater(todraw, errDiv, bitsPerPixel == 1 ? 250 : 1000);
            case YDisplay.DISPLAYSTATE.FAILURE:
              console.log("display failure");
              errDiv.innerText = errmsg.msg;
              return 0;
            case YDisplay.DISPLAYSTATE.OFF :
              console.log("display failure");
              errDiv.innerText = "Display is OFF";
              return 0;
            case YDisplay.DISPLAYSTATE.POWERING :
              console.log("display is busy at powering up , will retry later on ");
              return this.retrylater(todraw, errDiv);
          }
        let l: YDisplayLayer | null = await this.display.get_displayLayer(0)
        if (l == null)
          {
            console.log("failed to get display layer 0 ");
            return 0;
          }
        if (this.refreshRunning)
          {
            console.log("refresh is already running , will retry later on ");
            return this.retrylater(todraw, errDiv);
          }
        this.refreshRunning = true;
        let width: number = this.orientation == ORIENTATION.PAYSAGE ? this.width : this.height;
        let height: number = this.orientation == ORIENTATION.PAYSAGE ? this.height : this.width;
        let xx: number = 0;
        let yy: number = 0;
        let w: number = todraw.width;
        if (w > width)
          {
            w = width;
            xx = Math.floor((todraw.width - width) / 2);
          }
        let h: number = todraw.height;
        if (h > height)
          {
            h = height;
            yy = Math.floor((todraw.height - height) / 2);
          }
        let srcimg = ctx.getImageData(xx, yy, w, h);
        let ww: number = 1 + ((w - 1) >> (4 - bitsPerPixel));
        console.log("refresh : " + bitsPerPixel + "bitPerPx  width=" + w + "px height=" + h + "px  one row=" + ww + "bytes")
        let bitmap: Uint8Array = new Uint8Array(ww * h).fill(0)
        if (bitsPerPixel == 1)
          {
            for (let i: number = 0; i < w; i++) for (let j: number = 0; j < h; j++) if (srcimg.data[4 * (i + j * w) + 3] != 0)
              {
                let index: number = j * ww + (i >> 3)
                bitmap[index] |= 128 >> (i % 8)
              }
          } else if (bitsPerPixel == 2)
          {
            for (let i: number = 0; i < w; i++) for (let j: number = 0; j < h; j++) if (srcimg.data[4 * (i + j * w) + 3] != 0)
              {
                let index: number = j * ww + (i >> 2)
                bitmap[index] |= (0x80) >> (2 * (i % 4))
              }
          }
        let x: number = (width - srcimg.width) / 2;
        let y: number = (height - srcimg.height) / 2;
        await this.display.postponeRefresh(1000)
        await l.clear();
        if (this.orientation == ORIENTATION.PAYSAGE) await l.drawText(width / 2, 0, YDisplayLayer.ALIGN_TOP_CENTER, "Font editor preview");
        else
          {
            await l.drawText(width / 2, 0, YDisplayLayer.ALIGN_TOP_CENTER, "Font editor")
            await l.drawText(width / 2, 12, YDisplayLayer.ALIGN_TOP_CENTER, "preview")
          }
        await l.drawBitmap(x, y, w * bitsPerPixel, bitmap, -1);
        await this.display.triggerRefresh();
        console.log("refresh completed")
        errDiv.innerText = "";
        this.refreshRunning = false;
        return 1;
      }
  }

export class TextPreview extends UserInterfacePanel
  {
    private textSample: HTMLInputElement;
    private textDemo: HTMLCanvasElement;
    private previewStyle: HTMLSelectElement;
    private characterset: CharacterChooser
    private styleoptions: preViewStyleElement[]
    private zoomlevel = 1;
    private zoomOutBtn: ImgButton;
    private zoomInBtn: ImgButton;
    private paysageBtn: ImgButton;
    private portraitBtn: ImgButton;
    private errmsg: HTMLDivElement;
    private sizeIndicator: HTMLDivElement;
    private refreshTriggerTimeout: NodeJS.Timeout | null = null
    demoWidth: number = 128
    demoHeight: number = 64
    demoStyle: number = COLORSCHEME.OLED

    constructor(container: HTMLDivElement, characterset: CharacterChooser)
      {
        super(container, true, true, false)
        this.setTitle("Preview");
        this.characterset = characterset;
        this.body.style.display = "flex";
        this.body.style.alignItems = "center";
        this.body.style.justifyContent = "center";
        let table: HTMLTableElement = document.createElement("table")
        table.style.width = "100%"
        let TR: HTMLTableRowElement = document.createElement("tr")
        let TD: HTMLTableCellElement = document.createElement("td")
        TD.colSpan = 2
        TD.style.verticalAlign = "top"
        this.zoomOutBtn = new ImgButton(ressources.ZoomOutIcon, "Zoom out", (src: Button) => this.onZoomOutBtnClick(src));
        TD.appendChild(this.zoomOutBtn.htmlelement)
        this.zoomInBtn = new ImgButton(ressources.ZoomInIcon, "Zoom in", (src: Button) => this.onZoomInBtnClick(src));
        TD.appendChild(this.zoomInBtn.htmlelement)
        this.paysageBtn = new ImgButton(ressources.paysageIcon, "Paysage orientation", (src: Button) => this.onPaysageClick(src));
        TD.appendChild(this.paysageBtn.htmlelement)
        this.portraitBtn = new ImgButton(ressources.portraitIcon, "Portrait orientation", (src: Button) => this.onPortraitClick(src));
        TD.appendChild(this.portraitBtn.htmlelement)
        TR.appendChild(TD)
        table.appendChild(TR)
        TR = document.createElement("tr");
        TD = document.createElement("td")
        TD.innerText = "Display style:";
        TD.style.whiteSpace = "nowrap";
        TD.style.color = Const.headerTxtColor;
        TR.appendChild(TD)
        TD = document.createElement("td")
        TD.style.overflow = "hidden"
        this.previewStyle = document.createElement("select")
        this.previewStyle.style.overflow = "hidden"
        this.previewStyle.style.width = "90%"
        this.styleoptions = []
        this.previewStyle.add(new preViewStyleElement(this.styleoptions, COLORSCHEME.OLED, 128, 64).htmlElement)
        this.previewStyle.add(new preViewStyleElement(this.styleoptions, COLORSCHEME.OLED, 128, 32).htmlElement)
        this.previewStyle.add(new preViewStyleElement(this.styleoptions, COLORSCHEME.ePaper, 152, 152).htmlElement)
        this.previewStyle.add(new preViewStyleElement(this.styleoptions, COLORSCHEME.ePaper, 200, 200).htmlElement)
        this.previewStyle.add(new preViewStyleElement(this.styleoptions, COLORSCHEME.ePaper, 248, 128).htmlElement)
        this.previewStyle.add(new preViewStyleElement(this.styleoptions, COLORSCHEME.ePaper, 212, 104).htmlElement)
        this.previewStyle.add(new preViewStyleElement(this.styleoptions, COLORSCHEME.ePaper, 296, 152).htmlElement)
        this.previewStyle.add(new preViewStyleElement(this.styleoptions, COLORSCHEME.ePaper, 264, 176).htmlElement)
        this.previewStyle.add(new preViewStyleElement(this.styleoptions, COLORSCHEME.ePaper, 384, 168).htmlElement)
        this.previewStyle.add(new preViewStyleElement(this.styleoptions, COLORSCHEME.ePaper, 480, 176).htmlElement)
        this.previewStyle.add(new preViewStyleElement(this.styleoptions, COLORSCHEME.ePaper, 400, 300).htmlElement)
        TD.appendChild(this.previewStyle)
        TR.appendChild(TD)
        table.appendChild(TR)
        TR = document.createElement("tr")
        TD = document.createElement("td")
        TD.innerText = "Sample text:";
        TD.style.color = Const.headerTxtColor
        TD.style.whiteSpace = "nowrap";
        TR.appendChild(TD)
        TD = document.createElement("td")
        this.textSample = document.createElement("input");
        this.textSample.style.width = "90%";
        this.textSample.value = "Hello you!";
        TD.appendChild(this.textSample)
        TR.appendChild(TD)
        table.appendChild(TR)
        this.header?.appendChild(table);
        this.textDemo = document.createElement("canvas");
        new CanvasMagnifier(this.textDemo)
        this.textDemo.style.border = "1px solid black";
        this.textDemo.style.imageRendering = "pixelated"
        this.body?.appendChild(this.textDemo)
        this.previewStyle.value = "0"
        this.sizeIndicator = document.createElement("div");
        this.sizeIndicator.style.position = "absolute";
        this.sizeIndicator.style.left = "0px";
        this.sizeIndicator.style.bottom = "0px";
        this.sizeIndicator.style.color = Const.headerTxtColor;
        this.sizeIndicator.style.marginLeft = "5px";
        this.sizeIndicator.style.marginBottom = "5px";
        this.sizeIndicator.innerText = "";
        this.body?.appendChild(this.sizeIndicator)
        this.errmsg = document.createElement("div");
        this.errmsg.style.position = "absolute";
        this.errmsg.style.right = "0px";
        this.errmsg.style.bottom = "0px";
        this.errmsg.style.color = "red";
        this.errmsg.style.marginRight = "5px";
        this.errmsg.style.marginBottom = "5px";
        this.errmsg.innerText = "";
        this.body?.appendChild(this.errmsg)
        this.textSample.addEventListener("input", () => this.refresh())
        this.previewStyle.addEventListener("input", () => { this.styleHaschanged()})
        this.enableZoonButton();
        this.refreshButtons()
        this.refresh()
        this.set_headerHeigth(110)
      }

    private async styleHaschanged()
      {
        this.errmsg.innerText = "";
        let currentChoice: preViewStyleElement = this.styleoptions[parseInt(this.previewStyle.value)];
        if (!currentChoice.isEmulation) await (currentChoice as preViewStyleElementHWD).resetHwdDisplay();
        this.refreshButtons();
        await this.refresh()
      }

    private findDisplay(hwdname: string): number
      {
        for (let i: number = this.styleoptions.length - 1; i >= 0; i--) if (!this.styleoptions[i].isEmulation) if ((this.styleoptions[i] as preViewStyleElementHWD).matches(hwdname)) return i;
        return -1;
      }

    public async deviceArrival(m: YModule)
      {
        let count: number = await m.functionCount();
        for (let i: number = 0; i < count; i++)
          {
            let type: string = await m.functionType(i);
            if (type == "Display")
              {
                let name = await m.functionId(i);
                let displayHwdName: string = await m.get_serialNumber() + "." + name
                let index = this.findDisplay(displayHwdName);
                if (index < 0)
                  {
                    let display: YDisplay = await YDisplay.FindDisplay(displayHwdName);
                    let el = new preViewStyleElementHWD(this.styleoptions, COLORSCHEME.ePaper, 0, 0);
                    await el.init(display)
                    this.previewStyle.add(el.htmlElement)
                  } else
                  {
                    await (this.styleoptions[index] as preViewStyleElementHWD).fullRefresh()
                    this.refreshButtons()
                    this.refresh()
                  }
              }
          }
      }

    public async deviceRemoval(m: YModule)
      {
        let serial: string = await m.get_serialNumber()
        for (let i = 0; i < this.styleoptions.length; i++)
          {
            if (this.styleoptions[i].machesDevice(serial))
              {
                (this.styleoptions[i] as preViewStyleElementHWD).wentOffline();
                if (i == parseInt(this.previewStyle.value)) this.errmsg.innerText = "Display went offline"
                return;
              }
          }
      }

    private enableZoonButton()
      {
        if (this.zoomlevel > 3) this.zoomlevel = 3;
        if (this.zoomlevel < 0) this.zoomlevel = 0;
        this.textDemo.style.imageRendering = this.zoomlevel >= 1 ? "pixelated" : "auto"
        this.zoomInBtn.enabled = this.zoomlevel < 3;
        this.zoomOutBtn.enabled = this.zoomlevel > 0;
      }

    private onZoomInBtnClick(src: Button)
      {
        this.zoomlevel++;
        this.enableZoonButton()
        this.refresh();
      }

    private onZoomOutBtnClick(src: Button)
      {
        this.zoomlevel--;
        this.enableZoonButton()
        this.refresh();
      }

    private refreshButtons()
      {
        this.paysageBtn.selected = this.styleoptions[parseInt(this.previewStyle.value)].displayorientation == ORIENTATION.PAYSAGE;
        this.portraitBtn.selected = this.styleoptions[parseInt(this.previewStyle.value)].displayorientation == ORIENTATION.PORTRAIT;
      }

    private async onPaysageClick(src: Button)
      {
        await this.styleoptions[parseInt(this.previewStyle.value)].setOrientation(ORIENTATION.PAYSAGE);
        this.refreshButtons();
        this.refresh()
      }

    private async onPortraitClick(src: Button)
      {
        await this.styleoptions[parseInt(this.previewStyle.value)].setOrientation(ORIENTATION.PORTRAIT);
        this.refreshButtons();
        this.refresh()
      }

    public resized(width: number, height: number)
      {
        super.resized(width, height)
      }

    public triggerRefresh()
      {
        if (this.refreshTriggerTimeout != null) clearTimeout(this.refreshTriggerTimeout)
        this.refreshTriggerTimeout = setTimeout(() =>
        {
          this.refreshTriggerTimeout = null;
          this.refresh();
        }, 250);
      }

    public async refresh()
      {
        let currentChoice: preViewStyleElement = this.styleoptions[parseInt(this.previewStyle.value)];
        this.textDemo.width = currentChoice.displayorientation == ORIENTATION.PAYSAGE ? currentChoice.displayWidth : currentChoice.displayHeight
        this.textDemo.height = currentChoice.displayorientation == ORIENTATION.PAYSAGE ? currentChoice.displayHeight : currentChoice.displayWidth
        let zoom = this.zoomlevel > 0 ? this.zoomlevel : 1.0 / -(this.zoomlevel - 2);
        this.textDemo.style.width = (this.textDemo.width * zoom).toString() + "px";
        this.textDemo.style.height = (this.textDemo.height * zoom).toString() + "px";
        let ctx = this.textDemo.getContext("2d", {willReadFrequently: true});
        if (ctx == null) return;
        let color: [number, number, number] = [0, 0, 0];
        switch (currentChoice.displayType)
          {
            case COLORSCHEME.OLED :
              ctx.fillStyle = "black";
              color = [0x00, 0xFF, 0xff];
              break;
            case COLORSCHEME.ePaper :
              ctx.fillStyle = "#F0F0F0";
              color = [0x10, 0x10, 0x10];
              break;
          }
        ctx.fillRect(0, 0, this.textDemo.width, this.textDemo.height);
        let newText: string = this.textSample.value + '';
        let drawing: HTMLCanvasElement | null = this.characterset.preview(newText, color);
        if (drawing != null)
          {
            let x: number = Math.floor((this.textDemo.width - drawing.width) / 2)
            let y: number = Math.floor((this.textDemo.height - drawing.height) / 2)
            ctx.drawImage(drawing, x, y);
          }
        TimeMachine.newEntry(this.characterset.getYfmtData())
        let sizeInt: number = TimeMachine.currentSize();
        let sizeStr: string = sizeInt.toString() + " Bytes"
        if (sizeInt >= 1024) sizeStr = (Math.round(100 * sizeInt / 1024) / 100).toString() + " KB"
        this.sizeIndicator.innerText = "Expected file size: " + sizeStr
        if ((!currentChoice.isEmulation) && (drawing != null))
          {
            await (currentChoice as preViewStyleElementHWD).refreshHwdDisplay(drawing, this.errmsg)
          }
      }
  }