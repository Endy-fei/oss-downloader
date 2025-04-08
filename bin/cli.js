#!/usr/bin/env node

import { Command } from "commander";
import { downloadFromOSS } from "../src/index.js";
import chalk from "chalk";
import fs from "fs/promises";
import path from "path";
import yaml from "yaml";
import stripJsonComments from "strip-json-comments";

const program = new Command();

program
  .name("aliyunoss-downloader")
  .description("批量下载 OSS 文件到本地指定路径")
  .option("--config <file>", "JSON 或 YAML 配置文件路径")
  .option("--bucket <bucket>", "OSS Bucket 名称")
  .option("--region <region>", "OSS 区域，例如 oss-cn-hangzhou")
  .option("--accessKeyId <id>", "阿里云 accessKeyId")
  .option("--accessKeySecret <secret>", "阿里云 accessKeySecret")
  .option("--objectNames <names>", "多个 OSS 文件路径，用逗号分隔")
  .option("--localPath <path>", "保存到本地的目录")
  .parse();

const options = program.opts();

/**
 * 加载 JSON / YAML 配置文件
 * @param {string} filePath
 * @returns {Promise<object>}
 */
async function loadConfigFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const raw = await fs.readFile(filePath, "utf-8");

  if (ext === ".yaml" || ext === ".yml") {
    return yaml.parse(raw);
  } else if (ext === ".jsonc" || ext === ".json") {
    return JSON.parse(stripJsonComments(raw));
  } else {
    throw new Error(`不支持的配置文件格式: ${ext}`);
  }
}

/**
 * 合并命令行参数优先级高于配置文件
 */
async function loadDefaultConfigFile() {
  const candidates = [
    "aliyunoss.config.yaml",
    "aliyunoss.config.yml",
    "aliyunoss.config.jsonc",
    "aliyunoss.config.json",
  ];

  for (const file of candidates) {
    try {
      const fullPath = path.resolve(process.cwd(), file);
      await fs.access(fullPath);
      console.log(chalk.gray(`自动加载配置文件: ${file}`));
      return await loadConfigFile(fullPath);
    } catch {
      // 忽略找不到的文件
    }
  }

  return {};
}

async function buildFinalConfig() {
  let fileConfig = {};

  if (options.config) {
    try {
      fileConfig = await loadConfigFile(options.config);
    } catch (err) {
      console.error(chalk.red(`加载配置文件失败: ${err.message}`));
      process.exit(1);
    }
  } else {
    fileConfig = await loadDefaultConfigFile();
  }

  const merged = {
    ...fileConfig,
    ...options,
  };

  // objectNames 处理为数组
  if (typeof merged.objectNames === "string") {
    merged.objectNames = merged.objectNames.split(",").map((s) => s.trim());
  }


  const validRegions = new Set([
    'oss-cn-hangzhou',
    'oss-cn-shanghai',
    'oss-cn-beijing',
    'oss-cn-shenzhen',
    'oss-cn-hongkong',
    'oss-us-west-1',
    'oss-us-east-1',
    'oss-ap-southeast-1',
  ]);
  
  if (!validRegions.has(merged.region)) {
    throw new Error(`无效的 region 值: "${merged.region}"，请使用类似 "oss-cn-shenzhen" 的格式`);
  }

  return merged;
}

(async () => {
  try {
    const config = await buildFinalConfig();
    const required = [
      "bucket",
      "region",
      "accessKeyId",
      "accessKeySecret",
      "objectNames",
      "localPath",
    ];
    for (const key of required) {
      if (!config[key]) {
        throw new Error(`缺少必要参数：${key}`);
      }
    }
    await downloadFromOSS(config);
  } catch (err) {
    console.error(chalk.red(`执行失败：${err.message}`));
    process.exit(1);
  }
})();
