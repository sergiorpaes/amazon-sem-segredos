
import cookie from 'cookie';

export const handler = async (event: any) => {
    // Clear the auth_token cookie by setting its maxAge to 0 or an expired date
    const clearCookie = cookie.serialize('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0 // Expire immediately
    });

    return {
        statusCode: 200,
        headers: {
            'Set-Cookie': clearCookie,
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Logged out successfully' })
    };
};
