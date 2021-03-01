import * as Apn from 'apn';

const options = {
    token: {
        key: `${process.cwd()}/${process.env.KEY_FILE}`,
        keyId: process.env.NOTIFS_KEY_ID,
        teamId: process.env.TEAM_ID,
    },
    production: process.env.NODE_ENV === 'production',
};

export const apnProvider = new Apn.Provider(options);
