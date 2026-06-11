module.exports = (api) => {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/app': './src/app',
            '@/modules': './src/modules',
            '@/database': './src/database',
            '@/repositories': './src/repositories',
            '@/services': './src/services',
            '@/hooks': './src/hooks',
            '@/navigation': './src/navigation',
            '@/components': './src/components',
            '@/theme': './src/theme',
            '@/shared': './src/shared',
            '@/types': './src/types',
            '@/utils': './src/utils',
          },
        },
      ],
    ],
  };
};
