/*
 *   Yocto-FontEditor, a free web-based application
 *   to create .yfm font files for Yoctopuce displays
 *
 *    user interface main areas  handling
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
import {Const} from "./constants.js"

export abstract class UserInterfacePanel
  {
    protected header: HTMLDivElement | null = null;
    protected footer: HTMLDivElement | null = null;
    protected title: HTMLDivElement | null = null;
    protected body: HTMLDivElement;
    private container: HTMLDivElement
    private width: number = 0;
    private height: number = 0;
    private titleHeight = 32;
    private headerHeight = 50;
    private footerHeight = 20;
    private decayCounter: number = 0;
    private decayTimeout: NodeJS.Timeout | null = null;
    private currentR: number = 0;
    private currentG: number = 0;
    private currentB: number = 0;

    constructor(container: HTMLDivElement, hasTitle: boolean = true, hasHeader: boolean = true, hasFooter = true)
      {
        this.container = container;
        this.container.style.display = "none";
        if (hasTitle)
          {
            this.title = document.createElement("div");
            this.title.style.position = "absolute";
            this.title.style.lineHeight = "32px";
            this.title.style.backgroundColor = Const.titleBgColor
            this.title.style.color = Const.titleTxtColor
            this.title.innerText = "Title"
            this.title.style.fontSize = "20px"
            this.container.appendChild(this.title)
          }
        if (hasHeader)
          {
            this.header = document.createElement("div");
            this.header.style.position = "absolute";
            this.header.style.backgroundColor = Const.headerBgColor;
            this.header.style.color = Const.headerTxtColor;
            this.container.appendChild(this.header)
          }
        this.body = document.createElement("div");
        this.body.style.position = "absolute";
        this.body.style.overflow = "auto"
        this.body.style.backgroundColor = Const.pannelBgColor
        this.container.appendChild(this.body)
        if (hasFooter)
          {
            this.footer = document.createElement("div");
            this.footer.style.position = "absolute";
            this.footer.style.height = this.footerHeight.toString() + "px";
            this.footer.style.backgroundColor = Const.footerBgColor;
            this.footer.style.color = Const.footerTxtColor;
            this.footer.innerText = "Footer info"
            this.container.appendChild(this.footer)
          }
      }

    public set visible(yes: boolean)
      { this.container.style.display = yes ? "" : "none"}

    private startDecay()
      {
        this.stopDecay()
        this.decayCounter = 150;
        this.decayTimeout = setTimeout(() => {this.decay()}, 50)
      }

    private stopDecay()
      {
        if (this.decayTimeout != null) clearTimeout(this.decayTimeout)
        this.decayTimeout = null
      }

    private decay()
      {
        this.decayCounter--
        if (this.decayCounter <= 0)
          {
            this.setFooterMessage("");
            return
          }
        if (this.decayCounter < 20)
          {
            let opacity = this.decayCounter / 20;
            if (this.footer != null) this.footer.style.color = "rgba(" + this.currentR + ", " + this.currentG + ", " + this.currentB + ", " + opacity + ")";
          }
        this.decayTimeout = setTimeout(() => {this.decay()}, 50)
      }

    public set footerRightAlign(Yes: boolean)
      {
        if (this.footer == null) return
        this.footer.style.textAlign = Yes ? "right" : "left"
      }

    public resized(width: number, height: number)
      {
        this.width = width;
        this.height = height;
        let bodyHeight: number = height;
        let y: number = 0;
        if (this.title != null)
          {
            this.title.style.left = "0px";
            this.title.style.top = "0px";
            this.title.style.width = width.toString() + "px";
            this.title.style.height = this.titleHeight.toString() + "px";
            this.title.style.overflow = "hidden"
            y += this.titleHeight
            bodyHeight -= this.titleHeight;
          }
        if (this.header != null)
          {
            this.header.style.width = width.toString() + "px";
            this.header.style.height = this.headerHeight.toString() + "px";
            this.header.style.left = "0px";
            this.header.style.top = y.toString() + "px";
            y += this.headerHeight
            bodyHeight -= this.headerHeight;
          }
        if (this.footer != null)
          {
            this.footer.style.width = width.toString() + "px";
            this.footer.style.height = this.footerHeight.toString() + "px";
            this.footer.style.left = "0px";
            this.footer.style.top = (height - this.footerHeight).toString() + "px";
            this.footer.style.overflow = "hidden"
            bodyHeight -= this.footerHeight;
          }
        this.body.style.width = width.toString() + "px";
        this.body.style.height = bodyHeight.toString() + "px";
        this.body.style.left = "0px";
        this.body.style.top = y.toString() + "px";
      }

    public get headerItemsCount(): number
      {
        if (this.header != null) return this.header.childElementCount
        return 0
      }

    public set_headerHeigth(height: number)
      {
        if (this.headerHeight == height) return
        this.headerHeight = height
        if (this.width != 0) this.resized(this.width, this.height)
      }

    protected setTitle(title: string)
      {
        if (this.title == null) return
        this.title.innerHTML = "&nbsp;&nbsp;" + title
      }

    protected setFooterMessage(msg: string)
      {
        if (this.footer == null) return
        this.footer.style.color = Const.footerTxtColor;
        this.footer.innerHTML = "&nbsp;&nbsp;" + msg + "&nbsp;&nbsp;"
      }

    private setMessageColor(hexColor: number)
      {
        this.currentR = (hexColor >> 16) & 0xFF;
        this.currentG = (hexColor >> 8) & 0xFF;
        this.currentB = hexColor & 0xFF;
        if (this.footer != null) this.footer.style.color = "rgba(" + this.currentR + ", " + this.currentG + ", " + this.currentB + ", 1)";
      }

    protected setFooterSuccessMessage(msg: string)
      {
        if (this.footer == null) return
        this.setMessageColor(0x008000)
        this.footer.innerHTML = "&nbsp;&nbsp;" + msg + "&nbsp;&nbsp;"
        this.startDecay();
      }

    protected setFooterErrorMessage(msg: string)
      {
        if (this.footer == null) return
        this.setMessageColor(0x800000)
        this.footer.innerHTML = "&nbsp;&nbsp;" + msg + "&nbsp;&nbsp;"
        this.startDecay();
      }
  }
