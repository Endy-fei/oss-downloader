#!/usr/bin/env node

import { Command } from 'commander';
import { downloadFromOSS } from '../src/index.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('aliyunoss-downloader')
  .description('批量下载 OSS 文件到本地指定路径')
  .requiredOption('--bucket <bucket>', 'OSS Bucket 名称')
  .requiredOption('--region <region>', 'OSS 区域，例如 oss-cn-hangzhou')
  .requiredOption('--accessKeyId <id>', '阿里云 accessKeyId')
  .requiredOption('--accessKeySecret <secret>', '阿里云 accessKeySecret')
  .requiredOption('--objectNames <names>', '多个 OSS 文件路径，用逗号分隔')
  .requiredOption('--localPath <path>', '保存到本地的目录')
  .parse();

const options = program.opts();

(async () => {
  try {
    const objectNames = options.objectNames.split(',').map(name => name.trim());
    await downloadFromOSS({
      bucket: options.bucket,
      region: options.region,
      accessKeyId: options.accessKeyId,
      accessKeySecret: options.accessKeySecret,
      objectNames,
      localPath: options.localPath
    });
  } catch (err) {
    console.error(chalk.red(`执行失败：${err.message}`));
    process.exit(1);
  }
})();