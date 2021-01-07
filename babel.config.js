module.exports = (api) => {
    api.cache(true);

    return {
        presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            '@babel/preset-typescript',
        ],
        plugins: [
            ['babel-plugin-root-import'],
        ],
    };
};
