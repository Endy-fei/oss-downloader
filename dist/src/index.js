"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFiles = downloadFiles;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ali_oss_1 = __importDefault(require("ali-oss"));
const crypto = __importStar(require("crypto"));
const jsonc_parser_1 = require("jsonc-parser");
// 读取配置文件
function loadConfig(configPath) {
    const configRaw = fs.readFileSync(configPath, "utf-8");
    return (0, jsonc_parser_1.parse)(configRaw);
}
// 获取文件的 MD5
function md5File(filePath) {
    const data = fs.readFileSync(filePath);
    const hash = crypto.createHash("md5");
    hash.update(data);
    return hash.digest("hex");
}
// 获取 OSS 对象的 ETag（等同于 MD5）
async function getOssObjectMd5(client, objectKey) {
    const info = await client.head(objectKey);
    // @ts-ignore
    if (!info.res || !info.res.headers || !info.res.headers.etag) {
        throw new Error(`获取 ETag 失败: ${objectKey}`);
    }
    // @ts-ignore
    return info.res.headers.etag.replace(/"/g, ""); // 去掉引号∏
}
// 下载文件并进行 MD5 检查
async function downloadFiles(configPath) {
    const config = loadConfig(configPath);
    const client = new ali_oss_1.default({
        accessKeyId: config.accessKeyId,
        accessKeySecret: config.accessKeySecret,
        region: config.region,
        bucket: config.bucket,
    });
    for (const { source, target } of config.downloads) {
        const targetPath = path.resolve(target);
        let skipDownload = false;
        if (fs.existsSync(targetPath)) {
            try {
                const localMd5 = md5File(targetPath).toLowerCase();
                const remoteMd5 = (await getOssObjectMd5(client, source)).toLowerCase();
                console.log(`本地 MD5: ${localMd5}`);
                console.log(`远程 MD5: ${remoteMd5}`);
                if (localMd5 === remoteMd5) {
                    console.log(`✅ 跳过 ${source}，文件已存在且 MD5 相同`);
                    skipDownload = true;
                }
                else {
                    console.log(`⚠️ MD5 不一致，准备覆盖 ${target}`);
                }
            }
            catch (err) {
                console.error(`获取远程 MD5 失败: ${source}`, err);
            }
        }
        if (!skipDownload) {
            try {
                const result = await client.get(source);
                fs.mkdirSync(path.dirname(targetPath), { recursive: true });
                fs.writeFileSync(targetPath, result.content);
                console.log(`⬇️ 已下载: ${source} → ${target}`);
            }
            catch (err) {
                console.error(`下载失败: ${source}`, err);
            }
        }
    }
}
