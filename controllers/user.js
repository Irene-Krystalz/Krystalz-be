import { compare } from "bcrypt";
import jwt from "jsonwebtoken";
import sgMail from "@sendgrid/mail";

import User from "../models/user";
import permissions from "../permissions";
import { sgKey, sender, jwtSecret } from "../config";
import { throwErr, catchErr, checkValidationErr } from "../utils";

sgMail.setApiKey( sgKey );

const postSignIn = async ( req, res, next ) =>
{
    const { password, email } = req.body;

    checkValidationErr( req, next );

    try 
    {
        const user = await User.find( { email } );
        if ( !user )
        {
            const error =
            {
                message: "Expired Token",
                statusCode: 403
            };
            throwErr( error );
        }

        if ( !await compare( password, user.password ) )
        {
            const error =
            {
                message: "Email/Password mismatch",
                statusCode: 401
            };
            throwErr( error );
        }

        const token = jwt.sign(
            {
                email,
            }, jwtSecret,
            { expiresIn: "1h" }
        );

        res.status( 200 ).json( { user: { token, email, expires: 1 } } );


    }
    catch ( error ) 
    {
        catchErr( error, next );
    }
};

const postSignUp = async ( req, res, next ) =>
{
    const { name, email, password } = req.body;

    checkValidationErr( req, next );

    const user = await new User(
        {
            name, email, password,
            wishlist: [],
            cart: [],
            isVerified: false,
            permissions:
            {
                [ permissions.READ ]: true,
                [ permissions.WRITE ]: false,
                [ permissions.DELETE ]: false
            }
        } ).save();

    const response =
    {
        message: "User created",
        user:
        {
            name: user.name,
            email: user.email
        }
    };

    res.status( 201 ).json( response );

    const message = {
        to: email,
        from: sender,
        subject: "Krystalz",
        html: `<a target="_blank" href="http://localhost:3031/user/confirm-email?id=${ user._id }&emailToken=${ user.emailToken }">Confirm email.</a> <p> This link will expire in 1hr <p>`,
    };

    //send mail
    sgMail.send( message )
        .then( () => { } )
        .catch( error =>
        {
            if ( error.response )
            {
                console.error( "mail sending failed" );
            }
        } );

};

const confirmEmail = async ( req, res, next ) =>
{
    const { id, emailToken } = req.query;

    try 
    {
        const user = await User.findById( id );

        if ( user.emailToken )
        {
            const timeLeft = user.emailTokenExpires.getTime() - new Date().getTime();

            if ( user.emailToken === emailToken && timeLeft > 0 )
            {
                // @ts-ignore
                user.isVerified = true;
                user.emailToken = undefined;
                user.emailTokenExpires = undefined;
                await user.save();

                res.status( 200 ).json( { message: "User verified" } );
            }
            else
            {
                const error =
                {
                    message: "Invalid Action. Unable to verify user",
                    statusCode: 403
                };
                throwErr( error );

            }
        }
        else
        {
            const error =
            {
                message: "Expired Token",
                statusCode: 403
            };
            throwErr( error );
        }

    }
    catch ( error ) 
    {
        catchErr( error, next );
    }

};

export
{
    postSignIn,
    postSignUp,
    confirmEmail
};
