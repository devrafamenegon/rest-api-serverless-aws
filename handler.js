'use strict';
const DynamoDB = require('aws-sdk/clients/dynamodb');
const documentClient = new DynamoDB.DocumentClient({ region: 'us-east-1' })
const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME

const send = (statusCode, data) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify(data)
  }
}

module.exports.createNote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const { body } = event
  const bodyParsed = JSON.parse(body)

  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Item: {
        notesId: bodyParsed.id,
        title: bodyParsed.title,
        body: bodyParsed.body
      },
      ConditionExpression: "attribute_not_exists(notesId)"
    }

    await documentClient.put(params).promise();
    callback(null, send(201, bodyParsed));
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