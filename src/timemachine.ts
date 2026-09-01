/*
 *   Yocto-FontEditor, a free web-based application
 *   to create .yfm font files for Yoctopuce displays
 *
 *  undo/redo feature
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

export type refeshCallBack = () => void;

export class TimeMachine
  {
    private static historic: Uint8Array[] = []
    private static currentEntry: number = 0;
    private static ignoreNextEntry: boolean = false;
    private static maxUndos: number = 100;
    private static refreshUi: refeshCallBack | null = null;
    private static shouldSave: boolean = false;

    public static set refreshCallBack(callback: refeshCallBack)
      {
        TimeMachine.refreshUi = callback
      }

    public static userJustSavedHisWork()
      {
        TimeMachine.shouldSave = false
      }

    public static ShouldSave(event: BeforeUnloadEvent): string | void
      {
        if ((TimeMachine.shouldSave) && (!Const.version.startsWith("PATCH_")))
          {
            event.preventDefault();
            event.returnValue = true;
            return "You didn't save your work. If you leave now, you will lose it forever."  // doesn't seem to work
                                                                                             // anymore.
          }
      }

    public static get undoAvailable()
      {
        return TimeMachine.currentEntry > 1;
      }

    public static get redoAvailable()
      {
        return TimeMachine.currentEntry < TimeMachine.historic.length;
      }

    public static Uint8ArrayEquals(a: Uint8Array, b: Uint8Array)
      {
        let l: number = a.length;
        if (l != b.length) return false;
        for (let i: number = 0; i < l; i++) if (a[i] != b[i]) return false;
        return true;
      }

    public static newEntry(data: Uint8Array | null)
      {
        if (data == null) return
        if (TimeMachine.ignoreNextEntry)
          {
            TimeMachine.ignoreNextEntry = false;
            return;
          }
        if (TimeMachine.currentEntry < TimeMachine.historic.length)
          {
            TimeMachine.historic = TimeMachine.historic.slice(0, TimeMachine.currentEntry)
          }
        if (TimeMachine.currentEntry > 0) if (TimeMachine.Uint8ArrayEquals(TimeMachine.historic[TimeMachine.currentEntry - 1], data))
          {
            console.log("no change");
            return;
          }
        TimeMachine.shouldSave = true;
        TimeMachine.historic[TimeMachine.currentEntry] = data;
        TimeMachine.currentEntry++;
        if (TimeMachine.historic.length > TimeMachine.maxUndos)
          {
            TimeMachine.historic = TimeMachine.historic.slice(1, TimeMachine.historic.length)
            TimeMachine.currentEntry--;
            console.log("stored");
          }
        if (TimeMachine.refreshUi != null) TimeMachine.refreshUi();
      }

    public static undo(): Uint8Array | null
      {
        if (TimeMachine.currentEntry <= 1) return null;
        TimeMachine.currentEntry--;
        TimeMachine.ignoreNextEntry = true;
        if (TimeMachine.refreshUi != null) TimeMachine.refreshUi();
        return TimeMachine.historic[TimeMachine.currentEntry - 1]
      }

    public static currentSize(): number
      {
        if (TimeMachine.currentEntry <= 0) return 0;
        return TimeMachine.historic[TimeMachine.currentEntry - 1].length;
      }

    public static redo(): Uint8Array | null
      {
        if (TimeMachine.currentEntry >= TimeMachine.historic.length) return null;
        TimeMachine.currentEntry++;
        TimeMachine.ignoreNextEntry = true;
        if (TimeMachine.refreshUi != null) TimeMachine.refreshUi();
        return TimeMachine.historic[TimeMachine.currentEntry - 1]
      }
  }