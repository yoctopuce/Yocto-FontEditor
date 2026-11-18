Source folder
=============

This folder contains the TypeScript source code for the Yocto-FontEditor application.

The  application main entry point is  [Yocto-FontEditor.ts:WeabApp.run()](Yocto-FontEditor.ts), called from [Yocto-FontEditor.html](Yocto-FontEditor.html). 

## Folder content



| file                   | description                                                         |
|:-----------------------|:--------------------------------------------------------------------|
| `Yocto-FontEditor.ts`  | The application entry point and some generic functions              | 
| `bdf_decoder.ts`       | Glyph Bitmap Distribution Format files reader/decoder  
| `button.ts`            | UI buttons implementation                                           |
| `canvasMagnifier.ts`   | Adds a magnifier to canvas                                           |
| `characterRenderer.ts` | Character and character set rendered                                |
| `chooser.ts`           | Character chooser part UI                                           |
| `constants.ts`         | Application contants such as version, colors..                      |
| `editor.ts`            | Editor part UI                                                      |
| `export.ts`            | Export part UI                                                      |
| `preview.ts`           | Preview part UI                                                     |
| `README.md`            | This file                                                           |
| `ressources.ts`        | Graphical ressources                                                |
| `selection.ts`         | Editor selection management                                         |
| `timemachine.ts`       | undo/redo management                                                |
| `uipanel.ts`           | UI main parts management                                            |
| `welcome.ts`           | Welcome panel shown at application start                            |                                         /
| `serviceWorker.ts`     | The helper to make this app behave like a Progressive Web App (PWA) | 


## Building  code

For details on how to compile the application, see the [top-level README file](../README.md) 