/* eslint-disable import/prefer-default-export */
export const removeNullUndef = (obj: any) => {
    Object.keys(obj)
        .forEach((key) => {
            if (obj[key] === undefined || obj[key] === null || obj[key] === []) {
                // eslint-disable-next-line no-param-reassign
                delete obj[key];
            }
        });
    return obj;
};
