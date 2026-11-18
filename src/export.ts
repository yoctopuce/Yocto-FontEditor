/*
 *   Yocto-FontEditor, a free web-based application
 *   to create .yfm font files for Yoctopuce displays
 *
 *   user interface for export  part
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
import {UserInterfacePanel} from './uipanel.js'
import {CharacterChooser} from './chooser.js';
import {Button, TxtButton} from "./button.js";
import {YAPI, YErrorMsg, YModule} from "./yoctolib/yocto_api.js";
import {YFiles} from "./yoctolib/yocto_files.js";
import {TimeMachine} from "./timemachine.js";

class targetFileSystemElement
  {
    protected element: HTMLOptionElement;
    filesystem: YFiles | null = null;
    serial: string = "";
    description: string = "";
    online: boolean = false;

    constructor(containerlist: targetFileSystemElement[])
      {
        this.element = document.createElement("option");
        containerlist.push(this).toString()
        this.element.value = (containerlist.length - 1).toString();
      }

    public get htmlElement() { return this.element}

    public async init(filesystem: YFiles)
      {
        this.filesystem = filesystem;
        this.serial = await this.filesystem.get_serialNumber();
        this.description = await this.filesystem.get_friendlyName()
        this.element.text = this.description;
        this.online = true;
      }

    public matches(serial: string): boolean
      {
        return serial.startsWith(this.serial)
      }

    public async refresh()
      {
        if (this.filesystem == null) return
        this.online = await this.filesystem.isOnline()
        if (this.online)
          {
            this.description = await this.filesystem.get_friendlyName()
            this.element.text = this.description;
          } else this.element.text = this.description + " (offline)"
      }

    public get isOnline(): boolean {return this.online}
  }

export class ExportFontUI extends UserInterfacePanel
  {
    private characterset: CharacterChooser;
    private exportBtn: TxtButton;
    private downloadBtn: TxtButton
    private fsList: HTMLSelectElement;
    private filename: HTMLInputElement;
    private targetoptions: targetFileSystemElement[]
    private canExport : boolean = false


    constructor(container: HTMLDivElement, characterset: CharacterChooser)
      {
        super(container, true, false, true)
        this.setTitle("Export")
        this.setFooterMessage("")
        this.characterset = characterset;
        //    this.container.style.borderTop="1px solid grey"
        container.style.overflow = "hidden";
        this.targetoptions = []
        let table: HTMLTableElement = document.createElement("table")
        table.style.width = "100%"
        let TR: HTMLTableRowElement = document.createElement("tr")
        let TD: HTMLTableCellElement = document.createElement("td")
        TD.innerText = "Filesystem:";
        TD.style.textAlign = "right"
        TR.appendChild(TD)
        TD = document.createElement("td")
        this.fsList = document.createElement("select")
        this.fsList.style.width = "90%"
        this.fsList.addEventListener("change", () => {this.refreshExportButton()})
        TD.appendChild(this.fsList)
        TR.appendChild(TD);
        table.appendChild(TR)
        TR = document.createElement("tr")
        TD = document.createElement("td")
        TD.innerText = "File name:";
        TD.style.textAlign = "right"
        TR.appendChild(TD)
        TD = document.createElement("td")
        this.filename = document.createElement("input");
        this.filename.style.width = "90%"
        this.filename.value = "CustomFont.yfm"
        this.filename.addEventListener("input", () => {this.refreshExportButton()})
        TD.appendChild(this.filename)
        TR.appendChild(TD)
        table.appendChild(TR)
        TR = document.createElement("tr")
        TD = document.createElement("td")
        TD.colSpan = 2;
        TD.style.textAlign = "right"
        this.downloadBtn = new TxtButton("Direct download", "Download Font file to local computer", (src: Button) => this.downloadFont(src));
        TD.appendChild(this.downloadBtn.htmlelement)
        this.exportBtn = new TxtButton("Export", "Export font file to choosen Yoctopuce file system", (src: Button) => this.onExportBtnClick(src));
        this.exportBtn.enabled = false;
        TD.appendChild(this.exportBtn.htmlelement)
        TR.appendChild(TD)
        table.appendChild(TR)
        this.body.appendChild(table)
        this.footerRightAlign = true
        this.body.style.display = "flex";
        this.body.style.justifyContent = "center"; /* Horizontal centering */
        this.body.style.alignItems = "center";     /* Vertical centering */
      }

    public canExportFontFile(ok:boolean)
    { if (this.canExport != ok)
       { this.canExport = ok;
        this.refreshExportButton();
       }
    }

    private checkFilename()
      {
        let err: string = "";
        let value: string = this.filename.value.toUpperCase();
        if (value == "") err = "filename cannot be empty"; else for (let i: number = 0; i < value.length; i++)
          {
            let c: string = value.charAt(i);
            if (!(((c >= 'A') && (c <= 'Z')) || ((c >= '0') && (c <= '9')) || (c == "-") || (c == "_") || (c == ".")))
              {
                err = "filename contains invalid characters";
              }
          }
        this.filename.title = err;
        let ok: boolean = err == ""
        this.filename.style.backgroundColor = ok ? "" : "LightPink";
        this.exportBtn.enabled = ok;
        return ok;
      }

    public show(selectedFontFsSerial: string | null, filename: string | null)
      {
        this.visible = true
        if (filename)
          {
            let n: number = filename.lastIndexOf('.')
            if (n>0) filename=filename.substring(0,n)+".yfm"
          }
        if (filename != null) this.filename.value = filename;
        if (selectedFontFsSerial != null)
          {
            let index: number = this.findFileSystem(selectedFontFsSerial)
            if (index >= 0) this.fsList.value = index.toString()
          }
      }

    private refreshExportButton()
      {
        let ok: boolean = this.checkFilename();
        ok = ok && this.canExport;
        if (this.targetoptions.length <= 0) ok = false;
        if (ok)
          {
            ok = this.targetoptions[parseInt(this.fsList.value)].isOnline
          }
        this.exportBtn.enabled = ok;
        this.downloadBtn.enabled = this.canExport;
      }

    private findFileSystem(serial: string): number
      {
        for (let i: number = this.targetoptions.length - 1; i >= 0; i--) if (this.targetoptions[i].matches(serial)) return i;
        return -1;
      }

    private async onExportBtnClick(src: Button)
      {
        let target: YFiles | null = this.targetoptions[parseInt(this.fsList.value)].filesystem;
        if (target == null) return;
        let filename: string = this.filename.value;
        let data: Uint8Array | null = this.characterset.getYfmtData()
        if (data != null)
          {
            if (await target.isOnline())
              {
                let res: number = await target.upload(filename, data);
                if (res == YAPI.SUCCESS)
                  {
                    this.setFooterSuccessMessage("Export Done");
                    TimeMachine.userJustSavedHisWork()
                  } else this.setFooterErrorMessage("Export failed (" + target.get_errorMessage() + ")");
              } else this.setFooterErrorMessage("Export failed, filesystem is offline");
          }
      }

    public async deviceRemoval(m: YModule)
      {
        let serial: string = await m.get_serialNumber()
        for (let i = 0; i < this.targetoptions.length; i++)
          {
            if (this.targetoptions[i].matches(serial))
              {
                await this.targetoptions[i].refresh();
              }
          }
        this.refreshExportButton()
      }

    public async deviceArrival(m: YModule)
      {
        let count: number = await m.functionCount();
        for (let i: number = 0; i < count; i++)
          {
            let type: string = await m.functionType(i);
            if (type == "Files")
              {
                let name = await m.functionId(i);
                let filesystemHwdName: string = await m.get_serialNumber() + "." + name
                let index = this.findFileSystem(filesystemHwdName);
                if (index < 0)
                  {
                    let files: YFiles = await YFiles.FindFiles(filesystemHwdName);
                    let el = new targetFileSystemElement(this.targetoptions);
                    await el.init(files)
                    this.fsList.add(el.htmlElement)
                  } else
                  {
                    await (this.targetoptions[index]).refresh()
                  }
              }
          }
        this.refreshExportButton()
      }

    public resized(width: number, height: number)
      {
        super.resized(width, height)
      }

    private downloadFont(srcBtn: Button)
      {
        let data: Uint8Array | null = this.characterset.getYfmtData()
        if (data != null)
          { let blob: Blob = new Blob([data], { type:"application/octet-stream" });
            let myurl: string = URL.createObjectURL(blob);
            var element = document.createElement('a');

            element.setAttribute('href', myurl);
            element.setAttribute('download', (this.filename.value != "") ? this.filename.value : "customFont.yfm");
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            setTimeout(() => URL.revokeObjectURL(myurl), 1000);
            TimeMachine.userJustSavedHisWork()
            document.body.removeChild(element);
          }
      }
  }