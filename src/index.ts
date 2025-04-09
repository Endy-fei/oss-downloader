import * as fs from "fs";
import * as path from "path";
import OSS from "ali-oss";
import * as crypto from "crypto";
import { parse } from "jsonc-parser";

// 读取配置文件
function loadConfig(configPath: string) {
  const configRaw = fs.readFileSync(configPath, "utf-8");
  return parse(configRaw);
}

// 获取文件的 MD5
function md5File(filePath: string): string {
  const data = fs.readFileSync(filePath);
  const hash = crypto.createHash("md5");
  hash.update(data);
  return hash.digest("hex");
}

// 获取 OSS 对象的 ETag（等同于 MD5）
async function getOssObjectMd5(
  client: OSS,
  objectKey: string
): Promise<string> {
  const info = await client.head(objectKey);
  // @ts-ignore
  if (!info.res || !info.res.headers || !info.res.headers.etag) {
    throw new Error(`获取 ETag 失败: ${objectKey}`);
  }
  // @ts-ignore
  return info.res.headers.etag.replace(/"/g, ""); // 去掉引号∏
}

// 下载文件并进行 MD5 检查
async function downloadFiles(configPath: string) {
  const config = loadConfig(configPath);

  const client = new OSS({
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
        } else {
          console.log(`⚠️ MD5 不一致，准备覆盖 ${target}`);
        }
      } catch (err) {
        console.error(`获取远程 MD5 失败: ${source}`, err);
      }
    }

    if (!skipDownload) {
      try {
        const result = await client.get(source);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, result.content);
        console.log(`⬇️ 已下载: ${source} → ${target}`);
      } catch (err) {
        console.error(`下载失败: ${source}`, err);
      }
    }
  }
}

// 导出函数，供 CLI 调用
export { downloadFiles };
