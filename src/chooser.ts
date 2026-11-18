/*
 *   Yocto-FontEditor, a free web-based application
 *   to create .yfm font files for Yoctopuce displays
 *
 *   User interface for character chooser
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
import {CharacterRenderer, CharacterSetRenderer} from "./characterRenderer.js"
import {BtnFeature, ressources} from "./ressources.js"
import {Button, ImgButton} from "./button.js"
import {UserInterfacePanel} from "./uipanel.js";
import {TimeMachine} from './timemachine.js'
import {BDFdecoder} from "./bdf_decoder.js";

interface onCharSelectedCallback {(char: CharacterRenderer | null): void}

interface editorREfreshCallback {(): void}

interface gotoHomeCallback {(): void}

interface geometryChangeCallBack {(left:number,top:number,right:number,bottom:number):void}


export class CharacterChooser extends UserInterfacePanel
  {
    static asciiNames: string[] = ["NUL", "SOH", "STX", "ETX", "EOT", "ENQ", "ACK", "BEL", "BS", "HT", "LF", "VT", "FF", "CR", "SO", "SI", "DLE", "DC1", "DC2", "DC3", "DC4", "NAK", "SYN", "ETB", "CAN", "EM", "SUB", "ESC", "FS", "GS", "RS", "US", "SPACE", "!", "\"", "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", "DEL", "€", " ", "‚", "ƒ", "„", "…", "†", "‡", "ˆ", "‰", "Š", "‹", "Œ", " ", "Ž", " ", " ", "‘", "’", "“", "”", "•", "–", "—", "˜", "™", "š", "›", "œ", " ", "ž", "Ÿ", " ", "¡", "¢", "£", "¤", "¥", "¦", "§", "¨", "©", "ª", "«", "¬", " ", "®", "¯", "°", "±", "²", "³", "´", "µ", "¶", "·", "¸", "¹", "º", "»", "¼", "½", "¾", "¿", "À", "Á", "Â", "Ã", "Ä", "Å", "Æ", "Ç", "È", "É", "Ê", "Ë", "Ì", "Í", "Î", "Ï", "Ð", "Ñ", "Ò", "Ó", "Ô", "Õ", "Ö", "×", "Ø", "Ù", "Ú", "Û", "Ü", "Ý", "Þ", "ß", "à", "á", "â", "ã", "ä", "å", "æ", "ç", "è", "é", "ê", "ë", "ì", "í", "î", "ï", "ð", "ñ", "ò", "ó", "ô", "õ", "ö", "÷", "ø", "ù", "ú", "û", "ü", "ý", "þ", "ÿ"];
    private renderer: CharacterSetRenderer
    private zoomlevel: number = 1;
    private items: [CharacterRenderer | null, HTMLTableCellElement, boolean][];
    private clipBoard: CharacterRenderer[] = []
    private clipBoardBaseLine: number = 0
    private _selection: number[] = [];
    private lastSelected: number | null = null
    private homeCallback: gotoHomeCallback;
    private baseColor: string = "#FF000000"
    private activeColor: string = "#E0E0E0";
    private selectedColor: string = "#D0D0FF";
    private activeselectedColor: string = "#A0A0FF";
    private onCharSelected: onCharSelectedCallback | null;
    private refreshEditor: editorREfreshCallback | null = null
    private signalGeometryChangeToEditor :geometryChangeCallBack | null=null;


    private homeBtn: ImgButton;
    private zoomOutBtn: ImgButton;
    private zoomInBtn: ImgButton;
    private baselineUpBtn: ImgButton;
    private baselineDownBtn: ImgButton;
    private addTopRowBtn: ImgButton;
    private removeTopRowBtn: ImgButton
    private addBotRowBtn: ImgButton
    private removeBotRowBtn: ImgButton
    private CopyCharacterBtn: ImgButton
    private PasteCharacterBtn: ImgButton
    private undoBtn: ImgButton
    private redoBtn: ImgButton
    private AddNewCharacterBtn: ImgButton
    private RemoveChanracterBtn: ImgButton

    constructor(container: HTMLDivElement, renderer: CharacterSetRenderer, home: gotoHomeCallback, onCharSelected: onCharSelectedCallback | null = null)
      {
        super(container)
        this.setTitle("Character table");
        this.setFooterMessage("select a character or create a new one");
        const applies2All: string = " (applies to the whole glyph set)"
        this.homeCallback = home
        this.renderer = renderer;
        this.homeBtn = new ImgButton(ressources.HomeIcon, "Go back to Welcome panel ", (src: Button) => this.homeBtnClick(src));
        this.header?.appendChild(this.homeBtn.htmlelement)
        this.zoomOutBtn = new ImgButton(ressources.ZoomOutIcon, "Zoom out", (src: Button) => this.onZoomOutBtnClick(src));
        this.header?.appendChild(this.zoomOutBtn.htmlelement)
        this.zoomInBtn = new ImgButton(ressources.ZoomInIcon, "Zoom in", (src: Button) => this.onZoomInBtnClick(src));
        this.header?.appendChild(this.zoomInBtn.htmlelement)
        this.undoBtn = new ImgButton(ressources.UndoIcon, "Undo " + applies2All, (src: Button) => this.undo(src));
        this.header?.appendChild(this.undoBtn.htmlelement)
        this.redoBtn = new ImgButton(ressources.RedoIcon, "Redo " + applies2All, (src: Button) => this.redo(src));
        this.header?.appendChild(this.redoBtn.htmlelement)
        this.AddNewCharacterBtn = new ImgButton(ressources.GlyphIcon, "Create new glyph(s) on selected position(s)", (src: Button) => this.newCharacter(src), new Set<BtnFeature>([BtnFeature.New]));
        this.header?.appendChild(this.AddNewCharacterBtn.htmlelement)
        this.RemoveChanracterBtn = new ImgButton(ressources.GlyphIcon, "Delete glyphs from selected position(s)", (src: Button) => this.deleteCharacter(src), new Set<BtnFeature>([BtnFeature.Delete]));
        this.header?.appendChild(this.RemoveChanracterBtn.htmlelement)
        this.CopyCharacterBtn = new ImgButton(ressources.CopyCharIcon, "Copy glyph(s)", (src: Button) => this.copyCharcters(src));
        this.header?.appendChild(this.CopyCharacterBtn.htmlelement)
        this.PasteCharacterBtn = new ImgButton(ressources.PasteCharIcon, "Paste copied glyph(s) to selected position(s)", (src: Button) => this.pasteCharacters(src));
        this.header?.appendChild(this.PasteCharacterBtn.htmlelement)
        this.baselineUpBtn = new ImgButton(ressources.BaselineUpIcon, "Move baseline up" + applies2All, (src: Button) => this.onBaselineUpClick(src));
        this.header?.appendChild(this.baselineUpBtn.htmlelement)
        this.baselineDownBtn = new ImgButton(ressources.BaselineDownIcon, "Move baseline down" + applies2All, (src: Button) => this.onBaselineDownClick(src));
        this.header?.appendChild(this.baselineDownBtn.htmlelement)
        this.addTopRowBtn = new ImgButton(ressources.TopRowIcon, "Add a pixel row on top " + applies2All, (src: Button) => this.addRowOnTop(src), new Set<BtnFeature>([BtnFeature.Add]));
        this.header?.appendChild(this.addTopRowBtn.htmlelement)
        this.removeTopRowBtn = new ImgButton(ressources.TopRowIcon, "Remove a pixel row from top " + applies2All, (src: Button) => this.removeRowFromTop(src), new Set<BtnFeature>([BtnFeature.Delete]));
        this.header?.appendChild(this.removeTopRowBtn.htmlelement)
        this.addBotRowBtn = new ImgButton(ressources.BottomRowIcon, "Add a pixel row at bottom " + applies2All, (src: Button) => this.addRowOnBottom(src), new Set<BtnFeature>([BtnFeature.Add]));
        this.header?.appendChild(this.addBotRowBtn.htmlelement)
        this.removeBotRowBtn = new ImgButton(ressources.BottomRowIcon, "Remove a pixel row from bottom" + applies2All, (src: Button) => this.removeRowFromBottom(src), new Set<BtnFeature>([BtnFeature.Delete]));
        this.header?.appendChild(this.removeBotRowBtn.htmlelement)
        TimeMachine.refreshCallBack = () => {this.refreshUndoRedoBtn()};
        this.items = [];
        this.onCharSelected = onCharSelected;
        let table: HTMLTableElement = document.createElement('table');
        for (let y: number = 0; y < 32; y++)
          {
            let tr: HTMLTableRowElement = document.createElement('tr');
            table.appendChild(tr);
            let td: HTMLTableCellElement = document.createElement('td');
            let index: string = ("0" + (8 * y).toString(16));
            index = index.substr(index.length - 2);
            td.innerText = "0x" + index
            td.style.fontFamily = "Courier New"
            tr.appendChild(td);
            for (let x: number = 0; x < 8; x++)
              {
                let td: HTMLTableCellElement = document.createElement('td');
                let asciiCode = y * 8 + x;
                let c: CharacterRenderer | null = this.renderer.getCharacter(asciiCode);
                if (c != null) td.appendChild(c.canvas)
                tr.appendChild(td);
                td.style.textAlign = "center";
                td.style.verticalAlign = "middle";
                td.addEventListener('mouseover', (_event: MouseEvent) => {this.mouseover(asciiCode);})
                td.addEventListener('mouseout', (_event: MouseEvent) => {this.mouseout(asciiCode);})
                td.addEventListener('mousedown', (_event: MouseEvent) => {this.mousedown(asciiCode, _event);})
                this.items.push([c, td, false]);
              }
          }
        this.body.appendChild(table)
        this.refreshButtonState()
      }

    private undo(src: Button)
      {
        let data: Uint8Array | null = TimeMachine.undo();
        if (data != null) this.LoadData(data);
      }

    private redo(src: Button)
      {
        let data: Uint8Array | null = TimeMachine.redo();
        if (data != null) this.LoadData(data);
      }

    public changeGeometry(offsetLeft: number, offsetTop: number, offsetRight: number, offsetBottom: number)
      {
        for (let i: number = 0; i < this._selection.length; i++)
          {
            let asciiCode: number = this._selection[i];
            let c: CharacterRenderer | null = this.items[asciiCode][0];
            if (c != null) c.changeGeometry(offsetLeft, offsetTop, offsetRight, offsetBottom)
          }
      }


    private refreshCharactersTable()
      {
        for (let i: number = 0; i < 256; i++)
          {
            this.items[i][0] = this.renderer.getCharacter(i);
            let TD: HTMLTableCellElement = this.items[i][1];
            while (TD.firstChild)
              {// @ts-ignore
                TD.removeChild(TD.lastChild)
              }
            if (this.items[i][0] != null)
              {  // @ts-ignore
                TD.appendChild(this.items[i][0].canvas)
              }
          }
        if (this.refreshEditor != null) this.refreshEditor();
        if (this.onCharSelected != null)
          {
            let it: CharacterRenderer | null = null
            if (this.selection.length == 1) it = this.items[this.selection[0]][0]
            this.onCharSelected(it)
          }
      }

    private LoadData(data: Uint8Array)
      {
        this.renderer.importFromYfmData(data)
        this.refreshCharactersTable()
      }

    public initFromScratch(firstChar: number, lastChar: number, width: number, height: number)
      {
        this.renderer.initFromScratch(firstChar, lastChar, width, height)
        this.refreshCharactersTable()
      }

    public initFromBdfData(bdfData: BDFdecoder)
      { this.renderer.initFromBdfData(bdfData)
        this.refreshCharactersTable()


      }

    public initFromYfmData(data: Uint8Array)
      {
        this.LoadData(data);
      }

    public initFromTtfFont(fontname: string, size: number, firstchar: number, lastchar: number, antiAliasingFilter: number, fillStroke: number, outlineWidth: number)
      {
        this.renderer.importFromFont(fontname, size, firstchar, lastchar, antiAliasingFilter, fillStroke, outlineWidth)
        this.refreshCharactersTable()
      }

    private pasteCharacters(src: Button)
      {
        if (this.clipBoard.length <= 0) return
        if (this.selection.length <= 0) return;
        if ((this.clipBoard.length > 1) && (this.selection.length > 1) && (this.selection.length != this.clipBoard.length))
          {
            alert("Cannot paste glyphs: You have " + this.clipBoard.length + " glyphs in the clipboard, but selection size is " + this.selection.length)
            return;
          }
        let steps: number = Math.max(this.selection.length, this.clipBoard.length)
        let n: number = 0;
        for (let i: number = 0; i < steps; i++)
          {
            let index: number = this.selection[0] + i;
            if (this.selection.length > 1) index = this.selection[i];
            if (index <= 255)
              {
                let c: CharacterRenderer
                if (this.items[index][0] == null)
                  {
                    c = this.renderer.newCharacter(index, this.clipBoard[n].width);
                    let td: HTMLTableCellElement = this.items[index][1];
                    this.items[index][0] = c;
                    td.innerHTML = ''
                    td.appendChild(c.canvas)
                  } else
                  {
                    c = this.items[index][0] as CharacterRenderer;
                    c.setWidth(this.clipBoard[n].width)
                  }
                let contents: ImageData | null = this.clipBoard[n].getContents()
                if (contents != null)
                  {
                    let offset: number = this.renderer.height - this.renderer.baseline - this.clipBoard[n].height + this.clipBoardBaseLine;
                    c.update(contents, offset)
                  }
                this.renderer.setZoomLevel(this.zoomlevel);
                n = (n + 1) % this.clipBoard.length;
              }
          }
        if (this.onCharSelected != null)
          {
            this.onCharSelected(this.items[this.selection[0]][0] as CharacterRenderer);
          }
        if (this.refreshEditor != null) this.refreshEditor();
      }

    private copyCharcters(src: Button)
      {
        this.clipBoard = []
        this.clipBoardBaseLine = this.renderer.baseline;
        for (let i: number = 0; i < this.selection.length; i++)
          {
            let index: number = this.selection[i];
            if (this.items[index][0] != null)
              { this.clipBoard.push(this.items[index][0] as CharacterRenderer) }
          }
        this.refreshButtonState();
      }

    public get selection(): number[]
      {return this._selection}

    public get baseline() {return this.renderer.baseline};

    public set baseline(value) {this.renderer.baseline = value}

    public getYfmtData(): Uint8Array | null
      {
        return this.renderer.get_YFm_data()
      }

    public preview(text: string, color: [number, number, number]): HTMLCanvasElement | null
      {
        let canvas: HTMLCanvasElement = document.createElement('canvas')
        let w: number = 0;
        let h: number = 0;
        for (let i: number = 0; i < text.length; i++)
          {
            let asciiCode: number = text.charCodeAt(i);
            let c: CharacterRenderer | null = this.renderer.getCharacter(asciiCode);
            if (c != null)
              {
                w += c.width;
                h = Math.max(h, c.height);
              }
          }
        if (w == 0) return null
        canvas.width = w;
        canvas.height = h;
        let x: number = 0;
        for (let i: number = 0; i < text.length; i++)
          {
            let asciiCode: number = text.charCodeAt(i);
            let c: CharacterRenderer | null = this.renderer.getCharacter(asciiCode);
            if (c != null)
              {
                c.draw(canvas, x, 0, color)
                x += c.width
              }
          }
        return canvas;
      }

    private newCharacter(src: Button)
      {
        if (this._selection == null) return
        for (let n: number = 0; n < this._selection.length; n++)
          {
            let asciiCode: number = this._selection[n];
            let c: CharacterRenderer = this.renderer.newCharacter(asciiCode);
            let td: HTMLTableCellElement = this.items[asciiCode][1];
            this.items[asciiCode][0] = c;
            td.innerHTML = ''
            td.appendChild(c.canvas)
            this.renderer.setZoomLevel(this.zoomlevel);
            if (this.onCharSelected != null) this.onCharSelected(c)
          }
        if (this.refreshEditor != null) this.refreshEditor();
      }

    private deleteCharacter(src: Button)
      {
        if (this._selection == null) return
        for (let n: number = 0; n < this._selection.length; n++)
          {
            let asciiCode: number = this._selection[n];
            let td: HTMLTableCellElement = this.items[asciiCode][1];
            this.items[asciiCode][0] = null;
            this.renderer.removeCharacter(asciiCode);
            td.innerHTML = ''
            if (this.onCharSelected != null) this.onCharSelected(null)
          }
        if (this.refreshEditor != null) this.refreshEditor();
      }

    private refreshUndoRedoBtn()
      {
        this.undoBtn.enabled = TimeMachine.undoAvailable;
        this.redoBtn.enabled = TimeMachine.redoAvailable;
      }

    private refreshButtonState()
      {
        this.AddNewCharacterBtn.enabled = this.selection.length > 0
        this.RemoveChanracterBtn.enabled = this.selection.length > 0
        this.CopyCharacterBtn.enabled = this.selection.length > 0
        this.PasteCharacterBtn.enabled = this.clipBoard.length > 0
        this.refreshUndoRedoBtn()
      }

    private enableZoonButton()
      {
        this.zoomInBtn.enabled = this.zoomlevel <= 3;
        this.zoomOutBtn.enabled = this.zoomlevel >= -1;
      }

    private addRowOnTop(src: Button)
      {
        this.renderer.addRowOnTop()
        if (this.signalGeometryChangeToEditor != null) this.signalGeometryChangeToEditor(0,1,0,0);
      }

    private removeRowFromTop(src: Button)
      {
        this.renderer.removeRowFromTop()
        if (this.signalGeometryChangeToEditor != null) this.signalGeometryChangeToEditor(0,-1,0,0);
      }

    private addRowOnBottom(src: Button)
      {
        this.renderer.addRowOnBottom()
        if (this.signalGeometryChangeToEditor != null) this.signalGeometryChangeToEditor(0,0,0,1);
      }

    private removeRowFromBottom(src: Button)
      {
        this.renderer.removeRowFromBottom()
        if (this.signalGeometryChangeToEditor != null) this.signalGeometryChangeToEditor(0,0,0,-1);
      }

    private onBaselineUpClick(src: Button)
      {
        this.baseline++;
        if (this.refreshEditor != null) this.refreshEditor();
      }

    private onBaselineDownClick(src: Button)
      {
        this.baseline--;
        if (this.refreshEditor != null) this.refreshEditor();
      }

    private homeBtnClick(src: Button)
      {
        this.homeCallback()
      }

    private onZoomInBtnClick(src: Button)
      {
        this.zoomlevel++;
        this.renderer.setZoomLevel(this.zoomlevel);
        this.enableZoonButton()
      }

    private onZoomOutBtnClick(src: Button)
      {
        this.zoomlevel--;
        this.renderer.setZoomLevel(this.zoomlevel);
        this.enableZoonButton()
      }

    public set selectCallback(onCharSelected: onCharSelectedCallback | null)
      {
        this.onCharSelected = onCharSelected;
      }

    public set refreshCallback(refreshCallback: editorREfreshCallback | null)
      {
        this.refreshEditor = refreshCallback;
      }

    public set geometryHasChangedCallback(callback: geometryChangeCallBack | null )
      {
        this.signalGeometryChangeToEditor = callback;
      }


    private mouseover(asciiCode: number)
      {
        let td: HTMLTableCellElement = this.items[asciiCode][1]
        let selected: boolean = this.items[asciiCode][2]
        td.style.backgroundColor = selected ? this.activeselectedColor : this.activeColor;
        let hex: string = "0" + asciiCode.toString(16).toUpperCase()
        let description: string = CharacterChooser.asciiNames[asciiCode];
        if (description.length == 1) description = '"' + description + '"'
        this.setFooterMessage("Code: 0x" + (hex).substring(hex.length - 2) + " (" + asciiCode.toString() + " dec)  " + description)
      }

    private mouseout(asciiCode: number)
      {
        let td: HTMLTableCellElement = this.items[asciiCode][1]
        let selected: boolean = this.items[asciiCode][2]
        td.style.backgroundColor = selected ? this.selectedColor : this.baseColor;
        this.setFooterMessage("Select one or more characters")
      }

    private mousedown(asciiCode: number, event: MouseEvent)
      {
        if (!event.ctrlKey)
          {
            for (let i = 0; i < 256; i++) for (let i = 0; i < 256; i++) if (i != asciiCode) if (this.items[i][2])  // selected
              {
                this.items[i][2] = false
                this.items[i][1].style.backgroundColor = this.baseColor;
              }
          }
        let start: number = asciiCode;
        let end: number = asciiCode;
        if ((event.shiftKey) && (this.lastSelected != null))
          {
            if (this.lastSelected < asciiCode)
              {
                start = this.lastSelected;
                end = asciiCode
              } else
              {
                start = asciiCode;
                end = this.lastSelected
              }
          }
        this.lastSelected = asciiCode;
        for (let i: number = start; i <= end; i++)
          {
            this.items[i][2] = true
            this.items[i][1].style.backgroundColor = i == asciiCode ? this.activeselectedColor : this.selectedColor
          }
        let index: number = -1;
        this._selection = [];
        for (let i: number = 0; i < this.items.length; i++)
          {
            if (this.items[i][2])
              {
                this._selection.push(i)
              }
          }
        if (this.onCharSelected != null)
          {
            if ((this._selection.length == 1) && (this.items[asciiCode][0] != null)) this.onCharSelected(this.items[asciiCode][0] as CharacterRenderer); else this.onCharSelected(null);
          }
        this.refreshButtonState();
      }
  }
