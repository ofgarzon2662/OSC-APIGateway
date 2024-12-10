/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import * as grpc from '@grpc/grpc-js';
import { connect, signers, Contract } from '@hyperledger/fabric-gateway';
import * as crypto from 'node:crypto';
import { promises as fs } from 'fs';
import * as path from 'node:path';
import { TextDecoder } from 'util';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class AppService implements OnModuleInit {
  getHello(): string {
    return 'Hello World!';
  }

  private isInitialized = false;
  private channelName: string;
  private chaincodeName: string;
  private mspId: string;
  private cryptoPath: string;
  private keyDirectoryPath: string;
  private certDirectoryPath: string;
  private tlsCertPath: string;
  private peerEndpoint: string;
  private peerHostAlias: string;
  private readonly utf8Decoder = new TextDecoder();
  private gateway;
  private network; // Almacenará la instancia de network
  private contract: Contract; // Almacenará la instancia de contract

  private loadEnvironmentVariables(): void {
    this.channelName = this.envOrDefault('CHANNEL_NAME', 'mychannel');
    this.chaincodeName = this.envOrDefault('CHAINCODE_NAME', 'basic');
    this.mspId = this.envOrDefault('MSP_ID', 'Org1MSP');

    // Path to crypto materials.
    this.cryptoPath = this.envOrDefault(
      'CRYPTO_PATH',
      path.resolve(
        __dirname,
        '..',
        '..',
        'fabric-samples',
        'test-network',
        'organizations',
        'peerOrganizations',
        'org1.example.com',
      ),
    );

    console.log(`cryptoPath: ${this.cryptoPath}`);

    // Path to user private key directory.
    this.keyDirectoryPath = this.envOrDefault(
      'KEY_DIRECTORY_PATH',
      path.resolve(
        this.cryptoPath,
        'users',
        'User1@org1.example.com',
        'msp',
        'keystore',
      ),
    );

    // Path to user certificate directory.
    this.certDirectoryPath = this.envOrDefault(
      'CERT_DIRECTORY_PATH',
      path.resolve(
        this.cryptoPath,
        'users',
        'User1@org1.example.com',
        'msp',
        'signcerts',
      ),
    );

    // Path to peer tls certificate.
    this.tlsCertPath = this.envOrDefault(
      'TLS_CERT_PATH',
      path.resolve(
        this.cryptoPath,
        'peers',
        'peer0.org1.example.com',
        'tls',
        'ca.crt',
      ),
    );

    // Gateway peer endpoint.
    this.peerEndpoint = this.envOrDefault('PEER_ENDPOINT', 'localhost:7051');

    // Gateway peer SSL host name override.
    this.peerHostAlias = this.envOrDefault(
      'PEER_HOST_ALIAS',
      'peer0.org1.example.com',
    );
  }

  private envOrDefault(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  private async newGrpcConnection(): Promise<any> {
    console.log(`tlsCertPath: ${this.tlsCertPath}`);
    const tlsRootCert = await fs.readFile(this.tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(this.peerEndpoint, tlsCredentials, {
      'grpc.ssl_target_name_override': this.peerHostAlias,
    });
  }

  private async newIdentity() {
    const certPath = await this.getFirstDirFileName(this.certDirectoryPath);
    const credentials = await fs.readFile(certPath);
    const mspId = this.mspId;
    return { mspId, credentials };
  }

  private async getFirstDirFileName(dirPath: string): Promise<string> {
    const files = await fs.readdir(dirPath);
    const file = files[0];
    if (!file) {
      throw new Error(`No files in directory: ${dirPath}`);
    }
    return path.join(dirPath, file);
  }

  private async newSigner() {
    const keyPath = await this.getFirstDirFileName(this.keyDirectoryPath);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
  }

  async onModuleInit(): Promise<void> {
    this.loadEnvironmentVariables();
    const client = await this.newGrpcConnection();
    this.gateway = connect({
      client,
      identity: await this.newIdentity(),
      signer: await this.newSigner(),
      evaluateOptions: () => ({ deadline: Date.now() + 5000 }), // 5 segundos
      endorseOptions: () => ({ deadline: Date.now() + 15000 }), // 15 segundos
      submitOptions: () => ({ deadline: Date.now() + 5000 }), // 5 segundos
      commitStatusOptions: () => ({ deadline: Date.now() + 60000 }), // 1 minuto
    });

    console.log(`channelName:       ${this.channelName}`);
    console.log(`chaincodeName:     ${this.chaincodeName}`);
    console.log(`mspId:             ${this.mspId}`);
    console.log(`cryptoPath:        ${this.cryptoPath}`);
    console.log(`keyDirectoryPath:  ${this.keyDirectoryPath}`);
    console.log(`certDirectoryPath: ${this.certDirectoryPath}`);
    console.log(`tlsCertPath:       ${this.tlsCertPath}`);
    console.log(`peerEndpoint:      ${this.peerEndpoint}`);
    console.log(`peerHostAlias:     ${this.peerHostAlias}`);

    this.network = this.gateway.getNetwork(this.channelName);
    console.log('Client initialized', client);
    console.log('gateway', this.gateway);
    console.log('Network initialized', this.network);

    // Get the smart contract from the network.
    this.contract = this.network.getContract(this.chaincodeName);
    console.log(
      'Contract initialized FIRST',
      this.network.getContract(this.chaincodeName),
    );
    this.isInitialized = true;
    console.log('Gateway connection successful');
    console.log('Contract methods:', Object.keys(this.contract));
    this.contract.submitTransaction('InitLedger');

    const resultBytes = await this.contract.evaluateTransaction('GetAllAssets');
    const resultJson = this.utf8Decoder.decode(resultBytes);
    const result: unknown = JSON.parse(resultJson);
    console.log('*** Result:', result);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.gateway) {
      this.gateway.close();
      console.log('Gateway connection closed');
    }
  }

  // Métodos públicos para acceder a las instancias de network y contract
  public async getNetwork(): Promise<any> {
    return this.network;
  }

  public async getContract(): Promise<Contract> {
    if (!this.isInitialized) {
      console.log('Waiting for contract to be initialized...');
      // Espera hasta que isInitialized sea true
      await this.waitForInitialization();
    }

    console.log('Contract initialized', this.contract);
    console.log('Returning contract instance');
    return this.contract;
  }

  private waitForInitialization(): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.isInitialized) {
          clearInterval(interval);
          resolve();
        }
      }, 100); // Revisa cada 100ms
    });
  }
}
