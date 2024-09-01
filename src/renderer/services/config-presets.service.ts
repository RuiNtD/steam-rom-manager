import { Injectable } from '@angular/core';
import { ConfigPresets, xRequestOptions } from '../../models';
import { LoggerService } from './logger.service';
import { BehaviorSubject } from 'rxjs';
import { APP } from '../../variables';
import { xRequest } from '../../lib/x-request';
import * as json from '../../lib/helpers/json';
import * as paths from '../../paths';
import * as schemas from '../schemas';
import * as _ from 'lodash';
import * as path from 'path';

@Injectable()
export class ConfigurationPresetsService {
  private xRequest = new xRequest();
  private requestOpts: xRequestOptions = {
    responseType: 'json',
    method: 'GET',
    timeout: 5000,
  };
  private variableData: BehaviorSubject<ConfigPresets> = new BehaviorSubject(
    {},
  );
  private downloadStatus: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private validator: json.Validator = new json.Validator(schemas.configPresets);
  private savingIsDisabled: boolean = false;
  private rawURL: string =
    'https://raw.githubusercontent.com/SteamGridDB/steam-rom-manager/';
  private treesURL: string =
    'https://api.github.com/repos/SteamGridDB/steam-rom-manager/git/trees/';

  constructor(private loggerService: LoggerService) {
    this.load();
  }

  private get lang() {
    return APP.lang.configPresets.service;
  }

  get data() {
    return this.variableData.getValue();
  }

  get dataObservable() {
    return this.variableData.asObservable();
  }

  get isDownloading() {
    return this.downloadStatus;
  }
  async download(force: boolean = false) {
    if (!this.downloadStatus.getValue()) {
      this.downloadStatus.next(true);
      const hashesURL = this.rawURL.concat('master/files/presetsHashes.json');
      const presetsHashes = await this.xRequest.request(
        hashesURL,
        this.requestOpts,
      );
      const commit = this.commitLookup(APP.version, presetsHashes);
      const downloadURL = this.treesURL.concat(commit).concat('?recursive=1');
      const treeData = await this.xRequest.request(
        downloadURL,
        this.requestOpts,
      );
      let presetURLs = treeData.tree
        .filter((entry: any) => path.dirname(entry.path) == 'files/presets')
        .map((entry: any) => entry.path);
      let configPresets: any[] = [];
      for (let presetURL of presetURLs) {
        const cleanURL = presetURL
          .split('/')
          .map((x: string) => encodeURI(x))
          .join('/');
        const fullURL = this.rawURL.concat(commit).concat('/').concat(cleanURL);
        const configPreset = await this.xRequest.request(
          fullURL,
          this.requestOpts,
        );
        configPresets.push(configPreset);
      }
      let joinedPresets = Object.assign({}, ...configPresets);
      const error = this.set(joinedPresets);
      if (error) {
        this.loggerService.error(
          this.lang.error.failedToDownload__i.interpolate({
            error: error,
            commit: commit,
          }),
        );
      } else {
        this.loggerService.info(
          this.lang.info.downloaded,
          force ? { invokeAlert: true, alertTimeout: 5000 } : undefined,
        );
        this.save(force);
      }
      this.downloadStatus.next(false);
    }
  }

  async load() {
    try {
      await this.download();
      const data = await json.read<ConfigPresets>(paths.configPresets);
      const error = this.set(data || {});
      if (error !== null) {
        this.savingIsDisabled = true;
        this.loggerService.error(this.lang.error.loadingError, {
          invokeAlert: true,
          alertTimeout: 5000,
          doNotAppendToLog: true,
        });
        this.loggerService.error(
          this.lang.error.corruptedVariables__i.interpolate({
            file: paths.configPresets,
            error,
          }),
        );
      }
    } catch (error) {
      this.savingIsDisabled = true;
      this.loggerService.error(this.lang.error.loadingError, {
        invokeAlert: true,
        alertTimeout: 5000,
        doNotAppendToLog: true,
      });
      this.loggerService.error(error);
    }
  }

  set(data: ConfigPresets) {
    if (this.validator.validate(data).isValid()) {
      this.variableData.next(data);
      return null;
    } else return `\r\n${this.validator.errorString}`;
  }

  save(force: boolean = false) {
    if (!this.savingIsDisabled || force) {
      return json
        .write(paths.configPresets, this.variableData.getValue())
        .then()
        .catch((error) => {
          this.loggerService.error(this.lang.error.writingError, {
            invokeAlert: true,
            alertTimeout: 3000,
          });
          this.loggerService.error(error);
        });
    }
  }
  private numericVersion(appVersion: string) {
    return appVersion
      .split('.')
      .map((s, i) => Number(s) * Math.pow(0.01, i - 1))
      .reduce((x, y) => x + y);
  }
  private commitLookup(
    appVersion: string,
    presetsHashes: { [version: string]: { commit: string } },
  ) {
    try {
      const numericAppVersion = this.numericVersion(appVersion);
      for (const version in presetsHashes) {
        if (numericAppVersion <= this.numericVersion(version)) {
          this.loggerService.info(
            `SRM is not up to date, cached config presets downloaded from commit: ${presetsHashes[version].commit}`,
          );
          return presetsHashes[version].commit;
        }
      }
      return 'master';
    } catch (e) {
      return 'master';
    }
  }
}
