import path from "path";
import express from "express";
import { json } from "body-parser";

const app = express();

app.use( ( req, res, next ) =>
{
    res.header( "Access-Control-Allow-Origin", "*" );
    res.header( "Access-Control-Allow-Methods", "GET, POST, PUT,PATCH, DELETE" );
    res.header( "Access-Control-Allow-Headers", "Content-Type, Authorization" );
    next();
} );

app.use( json() );

app.use( "/images", express.static( path.join( __dirname, "images" ) ) );
app.get( "/favicon.ico", ( req, res ) => 
{
    res.status( 200 ).end();

} );


app.use( ( error, req, res, next ) =>
{
    console.log( error );
    const message = error.message;
    const status = error.statusCode || 500;
    const data = error.data;

    res.status( status ).json( { message, data } );

} );



export default app;

