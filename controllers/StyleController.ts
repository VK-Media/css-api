import { Request, Response } from 'express';
import * as fs from 'fs';
import * as sass from 'node-sass';
import * as md5 from 'md5';

import Files from '../utility/Files';
import StyleData from '../data/StyleData';

export class StyleController {
    public requestCss = (req: Request, res: Response) => {
        const requestData = req.query;
        const entries = Object.entries(requestData);
        const rootFolder = StyleData.getRootFolder();
        const essentialModule = StyleData.getModule('essential');
        
        let requestedModules: Array<string> = [];
        let modulesToRender: Array<string> = [];
        let dependenciesToAdd: Array<string> = [];
        let scssToRender: string = '';

        // Create array containing valid requested modules
        for (const [moduleName, include] of entries) {
            if(include === '1'){
                const module = StyleData.getModule(moduleName);

                if(module){
                    if(Files.isFile(`${__dirname}/..${rootFolder}${module.path}.scss`)){
                        requestedModules.push(moduleName);
                    }
                }
            }
        }

        // Make sure to only include module if none of it's potential parents are included.
        requestedModules.forEach(requestedModule => {
            const module = StyleData.getModule(requestedModule);

            if(module){
                const moduleHasParents = module.hasOwnProperty('parents');
                let includeModule = true;

                if(moduleHasParents){
                    module.parents.forEach(parent => {
                        if(requestedModules.indexOf(parent) !== -1) {
                            includeModule = false;
                        }
                    });
                }

                if(includeModule){
                    const fileToInclude = `..${rootFolder}${module.path}.scss`;
                    
                    scssToRender += `@import '${fileToInclude}';`;
                    modulesToRender.push(requestedModule);
                }

                if(module.hasOwnProperty('dependencies')){
                    const dependencies: Array<string> = module.dependencies;

                    dependencies.forEach((dependency: string) => {
                        if (dependenciesToAdd.indexOf(dependency) == -1) {
                            dependenciesToAdd.push(dependency);
                        }
                    });
                }
            }
        });

        // Create dependency list
        let dependenciesScss: string = '';

        dependenciesToAdd.forEach((dependencyToAdd: string) => {
            const module = StyleData.getModule(dependencyToAdd);
            const fileToInclude = `..${rootFolder}${module.path}.scss`;
            dependenciesScss += `@import '${fileToInclude}';${scssToRender}`;
        });

        // Prepend dependencies
        scssToRender = dependenciesScss + scssToRender;

        modulesToRender.sort();
        const namespace: string = md5(modulesToRender.join('-'));
        const tempScssFile: string = `${__dirname}/../temp/${namespace}.scss`;
        const cssOutput: string = `${__dirname}/../output/${namespace}.css`;

        // Create required folders if they don't already exist
        this.createRequiredFolders();

        if(Files.isFile(cssOutput)){
            return res.download(cssOutput, 'styles.css');
        } else {
            fs.writeFile(tempScssFile, scssToRender, (err) => {
                if(err){
                    console.log(err);
                    return res.send({ success: false });
                } else {
                    this.renderScss(tempScssFile, cssOutput, err => {
                        if(err){
                            console.log(err);
                            return res.send({ success: false });
                        } else {
                            // When CSS file has been created, remove the temp SCSS file
                            fs.unlink(tempScssFile, err => {
                                if(err){
                                    console.log(err);
                                    return res.send({ success: false });
                                } else {
                                    return res.download(cssOutput, 'styles.css', err => {
                                        if(err) console.log(err);
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    }

    protected renderScss(input: string, output: string, callback: Function): void {
        sass.render({
            file: input,
            outputStyle: 'compressed'
        }, (err, result) => {
            if(err){
                console.log(err);
            } else {
                fs.writeFile(output, result.css, err => {
                    callback(err);
                });
            }
        });
    }

    protected createScssFile() {

    }

    protected createRequiredFolders = (): boolean => {
        const tempFolder: string = `${__dirname}/../temp`;
        const outputFolder: string = `${__dirname}/../output`;
        let success = true;

        if(!Files.directoryExists(tempFolder)){
            if(!Files.createDirectory(tempFolder)){
                success = false;
            }
        }

        if(!Files.directoryExists(outputFolder)){
            if(!Files.createDirectory(outputFolder)){
                success = false;
            }
        }

        return success;
    }
}