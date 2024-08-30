import { languageManager } from "../../variables";
import {
  onlineProviders,
  imageLoadStrategies,
} from "../../lib/image-providers/available-providers";
import { availableThemes } from "../../lib/themes";

export const appSettings = {
  type: "object",
  properties: {
    version: { type: "number" },
    fuzzyMatcher: {
      type: "object",
      default: {},
      properties: {
        timestamps: {
          type: "object",
          default: {},
          properties: {
            check: { type: "number", default: 0 },
            download: { type: "number", default: 0 },
          },
        },
        verbose: { type: "boolean", default: false },
        filterProviders: { type: "boolean", default: true },
      },
    },
    environmentVariables: {
      type: "object",
      default: {},
      properties: {
        steamDirectory: { type: "string", default: "" },
        userAccounts: {
          type: "array",
          default: [] as string[],
          items: {
            type: "string",
          },
        },
        romsDirectory: { type: "string", default: "" },
        retroarchPath: { type: "string", default: "" },
        raCoresDirectory: { type: "string", default: "" },
        localImagesDirectory: { type: "string", default: "" },
      },
    },

    previewSettings: {
      type: "object",
      default: {},
      properties: {
        retrieveCurrentSteamImages: { type: "boolean", default: true },
        disableCategories: { type: "boolean", default: false },
        deleteDisabledShortcuts: { type: "boolean", default: false },
        imageZoomPercentage: {
          type: "number",
          default: 30,
          minimum: 10,
          maximum: 100,
        },
        imageLoadStrategy: {
          type: "string",
          enum: imageLoadStrategies,
          default: "loadLazy",
        },
        hideUserAccount: { type: "boolean", default: false },
      },
    },
    enabledProviders: {
      type: "array",
      default: onlineProviders,
      items: {
        oneOf: [
          {
            type: "string",
            enum: onlineProviders,
          },
        ],
      },
    },
    batchDownloadSize: { type: "number", default: 50 },
    dnsServers: {
      type: "array",
      default: [] as string[],
      items: {
        type: "string",
      },
    },
    language: {
      type: "string",
      default: languageManager.getDefaultLanguage(),
      enum: languageManager.getAvailableLanguages(),
    },
    theme: { type: "string", default: "Deck", enum: availableThemes },
    emudeckInstall: { type: "boolean", default: false },
    autoUpdate: { type: "boolean", default: true },
    offlineMode: { type: "boolean", default: false },
    navigationWidth: { type: "number", default: 0 },
    clearLogOnTest: { type: "boolean", default: false },
    autoKillSteam: { type: "boolean", default: false },
    autoRestartSteam: { type: "boolean", default: false },
  },
};
