'use strict';
const DynamoDB = require('aws-sdk/clients/dynamodb');
const { v4: uuidv4 } = require('uuid');

const documentClient = new DynamoDB.DocumentClient({ 
  region: 'us-east-1',
  maxRetries: 3,
  httpOptions: {
    timeout: 5000
  }
})

const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME

const send = (statusCode, data) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify(data)
  }
}

module.exports.createNote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const { body } = event;
  const bodyParsed = JSON.parse(body);

  try {
    const noteId = uuidv4();
    const params = {
      TableName: NOTES_TABLE_NAME,
      Item: {
        notesId: noteId,
        title: bodyParsed.title,
        body: bodyParsed.body
      },
      ConditionExpression: "attribute_not_exists(notesId)"
    };

    // Verificar se a nota com o mesmo ID já existe
    // const checkParams = {
    //   TableName: NOTES_TABLE_NAME,
    //   Key: {
    //     notesId: noteId
    //   }
    // };

    // const existingNote = await documentClient.get(checkParams).promise();

    // if (existingNote.Item) {
    //   // Nota com o mesmo ID já existe, retornar um erro
    //   callback(null, send(400, { error: 'Note with the same ID already exists' }));
    //   return;
    // }

    // Criar a nota se o ID não estiver em uso
    await documentClient.put(params).promise();
    callback(null, send(201, { id: noteId, ...bodyParsed }));
  } catch (error) {
    callback(null, send(500, error.message));
  }
};


module.exports.updateNote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const { pathParameters, body } = event;
  const bodyParsed = JSON.parse(body);
  
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: { notesId: pathParameters.id },
      UpdateExpression: 'set #title = :title, #body = :body',
      ExpressionAttributeNames: {
        '#title': 'title',
        '#body': 'body'
      },
      ExpressionAttributeValues: {
        ':title': bodyParsed.title,
        ':body': bodyParsed.body
      },
      ConditionExpression: 'attribute_exists(notesId)'
    }
    await documentClient.update(params).promise();
    callback(null, send(200, bodyParsed));

  } catch (error) {
    callback(null, send(500, error.message));
  }
};

module.exports.deleteNote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const { pathParameters } = event;
  
  try{
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: {
        notesId: pathParameters.id
      },
      ConditionExpression: 'attribute_exists(notesId)'
    }

    await documentClient.delete(params).promise();
    callback(null, send(200, pathParameters.id));

  } catch (error) {
    callback(null, send(500, error.message));
  }
  
};

module.exports.getAllNotes = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const params = {
      TableName: NOTES_TABLE_NAME
    }

    const notes = await documentClient.scan(params).promise();
    callback(null, send(200, notes));
  } catch (error) {
    callback(null, send(500, error.message));
  }
};