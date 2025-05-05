import {Client,Account} from 'appwrite';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('681461f5002f45cb88a3');

const account = new Account(client);

export {client,account};