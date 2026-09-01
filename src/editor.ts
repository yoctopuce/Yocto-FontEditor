/*
 *   Yocto-FontEditor, a free web-based application
 *   to create .yfm font files for Yoctopuce displays
 *
 *   user interface for character editor
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
import {CharacterRenderer} from './characterRenderer.js';
import {TextPreview} from "./preview.js"
import {BtnFeature, ressources} from "./ressources.js"
import {Button, ImgButton} from "./button.js"
import {CharacterChooser} from "./chooser.js";
import {GridSelection} from "./selection.js";

export class CharacterEditor extends UserInterfacePanel
  {
    static defaultHelp: string = "Select one or more glyph<br>positions in the left panel"
    static readonly PIXELCOLORBLACK = 1;
    static readonly PIXELCOLORINVERT = 2;
    static readonly PIXELCOLORWHITE = 3;
    static readonly NEWSELECTION = 4;
    private textPreview: TextPreview;
    private charChooser: CharacterChooser;
    private display: HTMLCanvasElement
    private editedChar: CharacterRenderer | null = null;
    private editedData: ImageData | null = null;
    private selection: GridSelection | null = null;
    private informativePanel: HTMLDivElement;
    private innerInformativePanel: HTMLDivElement;
    private zoom: number = 25;
    private zoomOutBtn: ImgButton;
    private zoomInBtn: ImgButton;
    private reverseColorBtn: ImgButton;
    private blackColorBtn: ImgButton;
    private whiteColorBtn: ImgButton;
    private newSelectionBtn: ImgButton;
    private vrtMirrorSelection: ImgButton;
    private hrzMirrorSelection: ImgButton;
    private blackSelectionBtn: ImgButton;
    private whiteSelectionBtn: ImgButton;
    private negativeSelectionBtn: ImgButton;
    private pasteSelectionBtn: ImgButton;
    private addLeftColBtn: ImgButton;
    private removeLeftColBtn: ImgButton;
    private addRightColBtn: ImgButton;
    private removeRightColBtn: ImgButton;
    private lastInvertedPixedX = -1;
    private lastInvertedPixedY = -1;
    private editedCharDescription: string = "";
    private selectedTool: number = CharacterEditor.PIXELCOLORINVERT;

    constructor(container: HTMLDivElement, textPreview: TextPreview, charChooser: CharacterChooser)
      {
        super(container)
        this.setTitle("Editor");
        this.setFooterMessage("Choose a character to edit");
        this.textPreview = textPreview
        this.charChooser = charChooser;
        this.charChooser.refreshCallback = () => {this.fullRefresh()}
        this.charChooser.geometryHasChangedCallback = (left:number,top:number,right:number,bottom:number) => {this.geometryHasChanged(left,top,right,bottom)}
        this.body.style.display = "flex";
        this.body.style.justifyContent = "center"; /* Horizontal centering */
        this.body.style.alignItems = "center";     /* Vertical centering */
        this.display = document.createElement('canvas');
        this.display.style.border = "1px solid black"
        this.display.style.imageRendering = "pixelated"
        this.display.addEventListener("mousedown", (_event: MouseEvent) => {this.mouseDown(_event)})
        this.display.addEventListener("mousemove", (_event: MouseEvent) => {this.mouseMove(_event)})
        this.display.addEventListener("mouseup", (_event: MouseEvent) => {this.mouseUp(_event)})
        this.display.addEventListener("mouseout", (_event: MouseEvent) => {this.mouseOut(_event)})
        this.display.addEventListener("contextmenu", (_event: MouseEvent) => {_event.preventDefault()});
        this.display.style.display = "none";
        this.body.appendChild(this.display)
        this.zoomOutBtn = new ImgButton(ressources.ZoomOutIcon, "Zoom out", (src: Button) => this.onZoomOutBtnClick(src));
        this.header?.appendChild(this.zoomOutBtn.htmlelement)
        this.zoomInBtn = new ImgButton(ressources.ZoomInIcon, "Zoom in", (src: Button) => this.onZoomInBtnClick(src));
        this.header?.appendChild(this.zoomInBtn.htmlelement)
        this.blackColorBtn = new ImgButton(ressources.SetBlackColorIcon, "Set pixel black", (src: Button) => this.setTool(src, CharacterEditor.PIXELCOLORBLACK));
        this.header?.appendChild(this.blackColorBtn.htmlelement)
        this.reverseColorBtn = new ImgButton(ressources.SetReverseColorIcon, "Reverse pixels color", (src: Button) => this.setTool(src, CharacterEditor.PIXELCOLORINVERT));
        this.header?.appendChild(this.reverseColorBtn.htmlelement)
        this.whiteColorBtn = new ImgButton(ressources.SetWhiteColorIcon, "Set pixel white", (src: Button) => this.setTool(src, CharacterEditor.PIXELCOLORWHITE));
        this.header?.appendChild(this.whiteColorBtn.htmlelement)
        this.newSelectionBtn = new ImgButton(ressources.NewSelectionIcon, "Create selection", (src: Button) => this.setTool(src, CharacterEditor.NEWSELECTION), new Set<BtnFeature>([BtnFeature.New]));
        this.header?.appendChild(this.newSelectionBtn.htmlelement)
        this.hrzMirrorSelection = new ImgButton(ressources.SelectionHrzMirrorIcon, "Mirror selection horizontally", (src: Button) => this.hrzMirror(src));
        this.header?.appendChild(this.hrzMirrorSelection.htmlelement)
        this.vrtMirrorSelection = new ImgButton(ressources.SelectionVrtMirrorIcon, "Mirror selection vertically", (src: Button) => this.vrtMirror(src));
        this.header?.appendChild(this.vrtMirrorSelection.htmlelement)
        this.blackSelectionBtn = new ImgButton(ressources.SelectionBlackFillIcon, "Set selection contents black", (src: Button) => this.blackSelection(src));
        this.header?.appendChild(this.blackSelectionBtn.htmlelement)
        this.whiteSelectionBtn = new ImgButton(ressources.SelectionWhiteFillIcon, "Set selection contents white", (src: Button) => this.whiteSelection(src));
        this.header?.appendChild(this.whiteSelectionBtn.htmlelement)
        this.negativeSelectionBtn = new ImgButton(ressources.SelectionNegativeIcon, "Inverse selection contents color", (src: Button) => this.negateSelection(src));
        this.header?.appendChild(this.negativeSelectionBtn.htmlelement)
        this.pasteSelectionBtn = new ImgButton(ressources.SelectionPaste, "Paste last selection", (src: Button) => this.pasteSelection(src));
        this.header?.appendChild(this.pasteSelectionBtn.htmlelement)
        this.addLeftColBtn = new ImgButton(ressources.LeftColIcon, "Add a pixel column on left ", (src: Button) => this.addColOnleft(src), new Set<BtnFeature>([BtnFeature.Add]));
        this.header?.appendChild(this.addLeftColBtn.htmlelement)
        this.removeLeftColBtn = new ImgButton(ressources.LeftColIcon, "Remove a pixel columon from left ", (src: Button) => this.removeColFromleft(src), new Set<BtnFeature>([BtnFeature.Delete]));
        this.header?.appendChild(this.removeLeftColBtn.htmlelement)
        this.addRightColBtn = new ImgButton(ressources.RightColIcon, "Add a pixel column on right ", (src: Button) => this.addColOnRight(src), new Set<BtnFeature>([BtnFeature.Add]));
        this.header?.appendChild(this.addRightColBtn.htmlelement)
        this.removeRightColBtn = new ImgButton(ressources.RightColIcon, "Remove a pixel column on right", (src: Button) => this.removeColFromright(src), new Set<BtnFeature>([BtnFeature.Delete]));
        this.header?.appendChild(this.removeRightColBtn.htmlelement)
        this.informativePanel = document.createElement('div');
        this.informativePanel.style.border = "1px solid " + Const.infoPanelBorderColor
        this.informativePanel.style.margin = "10px"
        this.informativePanel.style.backgroundColor = Const.infoPanelBgColor
        this.informativePanel.style.color = Const.infoPanelTxtColor
        this.informativePanel.style.borderRadius = "3px";
        this.innerInformativePanel = document.createElement('div');
        this.innerInformativePanel.style.margin = "10px 10px 10px 10px"
        this.innerInformativePanel.style.textAlign = "center"
        this.innerInformativePanel.innerHTML = CharacterEditor.defaultHelp
        this.informativePanel.appendChild(this.innerInformativePanel)
        this.informativePanel.style.display = "";
        this.setTool(this.reverseColorBtn, this.selectedTool); // forces icons update
        this.body.appendChild(this.informativePanel)
      }

    public resized(width: number, height: number)
      {
        super.resized(width, height)
        this.showInfoMessage()
      }

    private enableZoonButton()
      {
        this.zoomInBtn.enabled = this.zoom <= 50;
        this.zoomOutBtn.enabled = this.zoom >= 5;
      }

    private setTool(src: Button, tool: number)
      {
        this.selectedTool = tool;
        if (tool != CharacterEditor.NEWSELECTION)
          {
            this.flushSelection()
            if (this.selection != null) this.selection.active = false;
          }
        this.blackColorBtn.selected = this.selectedTool == CharacterEditor.PIXELCOLORBLACK;
        this.reverseColorBtn.selected = this.selectedTool == CharacterEditor.PIXELCOLORINVERT;
        this.whiteColorBtn.selected = this.selectedTool == CharacterEditor.PIXELCOLORWHITE;
        this.newSelectionBtn.selected = this.selectedTool == CharacterEditor.NEWSELECTION;
        let selectionToolEnabled: boolean = (this.selectedTool == CharacterEditor.NEWSELECTION) && this.selection != null
        this.vrtMirrorSelection.enabled = selectionToolEnabled
        this.hrzMirrorSelection.enabled = selectionToolEnabled
        this.blackSelectionBtn.enabled = selectionToolEnabled
        this.whiteSelectionBtn.enabled = selectionToolEnabled
        this.negativeSelectionBtn.enabled = selectionToolEnabled


        this.pasteSelectionBtn.enabled = ((this.selection != null) && !this.selection.active)
        if (this.selectedTool != CharacterEditor.NEWSELECTION) this.display.style.cursor = "default"
      }

    private blackSelection(src: Button)
      {
        if (this.selection == null) return;
        if (this.editedChar == null) return;
        this.selection.setBlack()
        this.drawSelection();
        this.editedChar.updateWidthSelection(this.selection)
        this.textPreview.triggerRefresh();
      }

    private whiteSelection(src: Button)
      {
        if (this.selection == null) return;
        if (this.editedChar == null) return;
        this.selection.setWhite()
        this.drawSelection();
        this.editedChar.updateWidthSelection(this.selection)
        this.textPreview.triggerRefresh();
      }

    private pasteSelection(src: Button)
      {
        if (this.selection == null) return;
        if (this.editedChar == null) return;
        this.setTool(src, CharacterEditor.NEWSELECTION)
        this.selection.active = true
        this.drawSelection();
        this.editedChar.updateWidthSelection(this.selection)
        this.textPreview.triggerRefresh();
      }

    private negateSelection(src: Button)
      {
        if (this.selection == null) return;
        if (this.editedChar == null) return;
        this.selection.colorReverse()
        this.drawSelection();
        this.editedChar.updateWidthSelection(this.selection)
        this.textPreview.triggerRefresh();
      }

    private hrzMirror(src: Button)
      {
        if (this.selection == null) return;
        if (this.editedChar == null) return;
        this.selection.hrzMirror()
        this.drawSelection();
        this.editedChar.updateWidthSelection(this.selection)
        this.textPreview.triggerRefresh();
      }

    private vrtMirror(src: Button)
      {
        if (this.selection == null) return;
        if (this.editedChar == null) return;
        this.selection.vrtMirror()
        this.drawSelection();
        this.editedChar.updateWidthSelection(this.selection)
        this.textPreview.triggerRefresh();
      }

    private addColOnleft(src: Button)
      {
        this.charChooser.changeGeometry(1, 0, 0, 0)
        if (this.selection) this.selection.changeGeometry(1, 0, 0, 0)
        this.fullRefresh()
      }

    private removeColFromleft(src: Button)
      {
        this.charChooser.changeGeometry(-1, 0, 0, 0)
        if (this.selection) this.selection.changeGeometry(-1, 0, 0, 0)
        this.fullRefresh()
      }

    private addColOnRight(src: Button)
      {
        this.charChooser.changeGeometry(0, 0, 1, 0)
        if (this.selection) this.selection.changeGeometry(0, 0, 1, 0)
        this.fullRefresh()
      }

    private removeColFromright(src: Button)
      {
        this.charChooser.changeGeometry(0, 0, -1, 0)
        if (this.selection) this.selection.changeGeometry(0, 0, -1, 0)
        this.fullRefresh()
      }

    public geometryHasChanged(offsetLeft: number, offsetTop: number, offsetRight: number, offsetBottom: number)
      {
        if (this.selection) this.selection.changeGeometry(offsetLeft, offsetTop, offsetRight, offsetBottom)
        this.fullRefresh()
      }


    private onZoomInBtnClick(src: Button)
      {
        this.zoom++;
        this.fullRefresh()
        this.enableZoonButton()
      }

    private onZoomOutBtnClick(src: Button)
      {
        this.zoom--;
        this.fullRefresh()
        this.enableZoonButton()
      }

    private mouseDown(event: MouseEvent)
      {
        if (this.selectedTool == CharacterEditor.NEWSELECTION)
          {
            let x: number = Math.max(0, Math.floor((event.offsetX - 1) / this.zoom));
            let y: number = Math.max(0, Math.floor((event.offsetY - 1) / this.zoom));
            if (event.button != 0) return  // 0= mouse's left button
            if (this.selection != null) if ((this.selection.active) && (!this.selection.creating))
              {
                if (this.selection.isInside(x, y))
                  {
                    this.selection.setMoveOrigin(x, y);
                    return
                  }
              }
            if ((this.selection != null) && this.selection.active) this.drawSelection(true)
            this.selection = new GridSelection(x, y)
            this.selection.creating = true
            this.drawSelection()
            return
          }
        this.ActionOnPixel(event);
      }

    private mouseUp(event: MouseEvent)
      {
        this.lastInvertedPixedX = -1;
        this.lastInvertedPixedY = -1;
        if (this.editedChar == null) return
        if (this.selection == null) return
        if (!this.selection.active) return
        this.selection.creating = false
        if (event.button == 2)  // remove selection
          {
            this.drawSelection(true);
            this.selection.active = false;
            this.UpdateSelectionButton();
            return;
          }
        if (this.selection.glyphZoneData != null)
          {
            this.selection.shiftCompleted();
            this.UpdateSelectionButton();
            if (this.editedChar == null) return
            this.editedChar.updateWidthSelection(this.selection)
            this.textPreview.triggerRefresh();
            return
          }
        this.selection.setZoneData(this.editedChar.getContents(), this.editedChar.getDataZone(this.selection.x, this.selection.y, this.selection.width, this.selection.height))
        this.UpdateSelectionButton();
      }

    private mouseMove(event: MouseEvent)
      {
        let position: string = "";
        let x: number = Math.max(0, Math.floor((event.offsetX - 1) / this.zoom));
        let y: number = Math.max(0, Math.floor((event.offsetY - 1) / this.zoom));
        if (this.editedChar != null)
          {
            let h = this.editedChar.height;
            position = " Position= (" + x.toString() + "," + (h - y - 1).toString() + ")"
          }
        this.setFooterMessage(this.editedCharDescription + position);
        // no button
        if ((event.buttons == 0) && (this.selectedTool == CharacterEditor.NEWSELECTION))
          {
            if (this.selection != null) if (this.selection.active) if (this.selection.selectionZoneData != null)
              {
                if (this.selection.isInside(x, y)) this.display.style.cursor = "move";
                 else this.display.style.cursor = "default"

              } else this.display.style.cursor = "default"
            if ((this.selection == null || ((this.selection != null) && !this.selection.active)))
              if (this.display.style.cursor != "default") this.display.style.cursor = "default"
            return
          }
        // left button
        if ((event.buttons == 1) && (this.selectedTool == CharacterEditor.NEWSELECTION))
          {
            if ((this.selection != null) && (this.selection.active) && (!this.selection.creating)) if (this.selection.selectionZoneData != null) if (this.selection.isMoving)
              {
                this.drawSelection(true);
                this.selection.shift(x, y)
                this.drawSelection();
                return
              }
          }
        if (event.buttons != 1) return;
        if (this.selectedTool == CharacterEditor.NEWSELECTION)
          {
            if (this.selection == null) return;
            this.drawSelection(true);
            this.selection.setCorner(x, y)
            this.drawSelection()
            if (this.editedChar == null) return
            return
          }
        this.ActionOnPixel(event);
      }

    private mouseOut(event: MouseEvent)
      {
        this.lastInvertedPixedX = -1;
        this.lastInvertedPixedY = -1;
        this.setFooterMessage(this.editedCharDescription);
      }

    private flushSelection()
      {
        if (this.selection == null) return;
        if (this.editedChar != null)
          {
            if (this.selection.active)
              {
                this.editedChar.updateWidthSelection(this.selection)
                this.selection.setZoneData(this.editedChar.getContents()); // update selection background
                this.editedData = this.editedChar.imageData;
              }
          }
        this.drawSelection(true);
        this.selection.active = false;
      }

    private UpdateSelectionButton()
      {
        let state = false;
        if ((this.selection != null) && this.selection.active) state = true;
        this.vrtMirrorSelection.enabled = state;
        this.hrzMirrorSelection.enabled = state;
        this.blackSelectionBtn.enabled = state
        this.whiteSelectionBtn.enabled = state
        this.negativeSelectionBtn.enabled = state
        this.pasteSelectionBtn.enabled = ((this.selection != null) && !this.selection.active)
      }

    private drawSelection(clear: boolean = false)
      {
        if (this.selection == null) return
        if (!this.selection.active) return
        let ctx: CanvasRenderingContext2D | null = this.display.getContext("2d", {willReadFrequently: true});
        if (ctx == null) return
        if (clear)
          {
            ctx.strokeStyle = "white"
            ctx.setLineDash([]);
          } else
          {
            ctx.strokeStyle = "blue"
            ctx.setLineDash([2, 2]);
          }
        ctx.lineWidth = 1
        ctx.beginPath();
        ctx.rect(1 + this.selection.x * this.zoom - 0.5, 1 + this.selection.y * this.zoom - 0.5, this.selection.width * this.zoom, this.selection.height * this.zoom);
        ctx.stroke();
        if (clear) this.drawBaseLine(ctx)
        if (this.editedChar == null) return
        let w: number = this.editedChar.width
        let h: number = this.editedChar.height
        let X1: number = this.selection.x;
        let Y1: number = this.selection.y;
        let X2: number = X1 + this.selection.width - 1;
        let Y2: number = Y1 + this.selection.height - 1
        let W2 = X2 - X1 + 1;
        let background: ImageData | null = this.selection.glyphZoneData;
        let selection: ImageData | null = this.selection.selectionZoneData;
        if (background == null) return
        if (selection == null) return
        for (let x: number = 0; x < w; x++) for (let y: number = 0; y < h; y++)
          {
            let index = 4 * (x + y * w) + 3;
            let color: string = "white"
            if (background.data[index] == 255) color = 'black'; else color = 'white'
            if ((x >= X1) && (x <= X2) && (y >= Y1) && (y <= Y2))
              {
                let index2: number = 4 * ((x - X1) + (y - Y1) * W2) + 3;
                if (selection.data[index2] == 255) color = 'black'; else color = 'white'
              }
            ctx.fillStyle = color
            ctx.fillRect(1 + x * this.zoom, 1 + y * this.zoom, this.zoom - 1, this.zoom - 1);
          }
      }

    private drawBaseLine(ctx: CanvasRenderingContext2D)
      {
        let baslineY = this.display.height - this.charChooser.baseline * this.zoom
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.moveTo(0, baslineY - 0.5);
        ctx.lineTo(this.display.width, baslineY - 0.5);
        ctx.stroke();
      }

    private ActionOnPixel(event: MouseEvent)
      {
        if (this.editedChar == null) return
        if (this.editedData == null) return
        let ctx: CanvasRenderingContext2D | null = this.display.getContext("2d", {willReadFrequently: true});
        if (ctx == null) return
        let x: number = Math.max(0, Math.floor((event.offsetX - 1) / this.zoom));
        let y: number = Math.max(0, Math.floor((event.offsetY - 1) / this.zoom));
        let w: number = this.editedChar.width
        let index: number = 4 * (x + y * w) + 3;
        let color: number = this.editedData.data[index];
        let newcolor = color;
        switch (this.selectedTool)
          {
            case  CharacterEditor.PIXELCOLORINVERT:
              if ((x != this.lastInvertedPixedX) || (y != this.lastInvertedPixedY))
                {
                  newcolor = 255 - color;
                  this.lastInvertedPixedX = x;
                  this.lastInvertedPixedY = y;
                }
              break;
            case CharacterEditor.PIXELCOLORBLACK:
              newcolor = 255;
              break;
            case CharacterEditor.PIXELCOLORWHITE:
              newcolor = 0;
              break;
          }
        if (newcolor == color) return;
        ctx.fillStyle = newcolor == 0 ? "white" : "black";
        this.editedData.data[index] = newcolor;
        ctx.fillRect(1 + x * this.zoom, 1 + y * this.zoom, this.zoom - 1, this.zoom - 1);
        this.editedChar.update(this.editedData)
        this.textPreview.triggerRefresh();
      }

    private fullRefresh(refreshPreviewAsWell: boolean = true)
      {
        if (this.editedChar == null)
          {
            this.textPreview.triggerRefresh(); // actually the Charset migh have changed
            return
          }
        this.display.width = this.editedChar.width * this.zoom + 1
        this.display.height = this.editedChar.height * this.zoom + 1
        let ctx: CanvasRenderingContext2D | null = this.display.getContext("2d", {willReadFrequently: true});
        if (ctx == null) return
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, this.display.width, this.display.height);
        ctx.fillStyle = "black";
        this.editedData = this.editedChar.imageData;
        let w: number = this.editedChar.width
        let h: number = this.editedChar.height
        this.drawBaseLine(ctx)
        for (let x: number = 0; x < w; x++) for (let y: number = 0; y < h; y++)
          {
            let index = 4 * (x + y * w) + 3;
            if (this.editedData.data[index] == 255) ctx.fillRect(1 + x * this.zoom, 1 + y * this.zoom, this.zoom - 1, this.zoom - 1);
          }


        this.drawSelection()
        if (refreshPreviewAsWell) this.textPreview.triggerRefresh();
      }

    private showInfoMessage()
      {
        if (this.editedChar == null)
          {
            this.informativePanel.style.display = "";
            this.display.style.display = "none"
            if (this.charChooser != null)
              {
                this.setFooterMessage("");
                let info: string;
                let n: number = this.charChooser.selection.length;
                if (n <= 0) info = CharacterEditor.defaultHelp; else if (n == 1) info = "You selected an empty position,<br>but you can create a new glyph inside it." ; else info = n + " glyphs selected.<br>Further actions will apply<br>to the whole selection"
                if (window.devicePixelRatio % 1 != 0)
                  {
                    let ratio: number = Math.round(window.devicePixelRatio * 100) / 100
                    info += "<br><br>- WARNING -<br>OS and browser zoom levels<br>combination results in a pixel size<br>which is not a whole number (" + ratio + ").<br>This will cause misleading rendering artefacts"
                  }
                this.innerInformativePanel.innerHTML = info
              } else this.informativePanel.style.display = "none";
          }
      }

    public edit(c: CharacterRenderer | null)
      {
        this.flushSelection();
        this.editedChar = c
        if (c != null)
          {
            this.fullRefresh(false)
            this.informativePanel.style.display = "none";
            this.display.style.display = ""
            let asciiCode: number = c.ascii
            let hex: string = "0" + asciiCode.toString(16).toUpperCase()
            let description: string = CharacterChooser.asciiNames[asciiCode];
            if (description.length == 1) description = '"' + description + '"'
            description = description + "    " + c.width.toString() + "x" + c.height.toString() + "px"
            this.editedCharDescription = "Code: 0x" + (hex).substring(hex.length - 2) + " (" + asciiCode.toString() + " dec)  " + description;
            this.setFooterMessage(this.editedCharDescription)
            if (this.selection != null)
              {
                this.selection.setZoneData(c.getContents())
                this.UpdateSelectionButton()
              }
          }
        this.showInfoMessage()
      }
  }