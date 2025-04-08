import OSS from 'ali-oss';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * 从阿里云 OSS 下载多个对象到本地路径
 * @param {Object} config OSS 配置和任务参数
 * @param {string} config.bucket
 * @param {string} config.region
 * @param {string} config.accessKeyId
 * @param {string} config.accessKeySecret
 * @param {string[]} config.objectNames OSS 上的对象 key 数组
 * @param {string} config.localPath 本地目标目录
 */
export async function downloadFromOSS(config) {
  const {
    bucket,
    region,
    accessKeyId,
    accessKeySecret,
    objectNames,
    localPath
  } = config;

  const client = new OSS({
    region,
    accessKeyId,
    accessKeySecret,
    bucket
  });

  const basePath = path.resolve(localPath);
  await fs.mkdir(basePath, { recursive: true });

  for (const objectName of objectNames) {
    try {
      const result = await client.get(objectName);
      const filename = path.basename(objectName);
      const filePath = path.join(basePath, filename);

      await fs.writeFile(filePath, result.content);
      console.log(`✅ 下载成功: ${objectName} → ${filePath}`);
    } catch (err) {
      console.error(`❌ 下载失败: ${objectName} → ${err.message}`);
    }
  }
}