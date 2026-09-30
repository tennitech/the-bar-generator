const { hasProfanity, sanitizeText } = require('../js/utils/profanityFilter');

describe('Profanity Filter', () => {
    test('should detect profanity in text', () => {
        expect(hasProfanity('This is a damn test')).toBe(true);
        expect(hasProfanity('hell no')).toBe(true);
    });

    test('should not detect profanity in clean text', () => {
        expect(hasProfanity('Hello world')).toBe(false);
        expect(hasProfanity('RPI is great')).toBe(false);
    });

    test('should sanitize profanity with asterisks', () => {
        expect(sanitizeText('This is a damn test')).toBe('This is a **** test');
        expect(sanitizeText('What the hell')).toBe('What the ****');
    });

    test('should be case insensitive', () => {
        expect(hasProfanity('DaMn it')).toBe(true);
        expect(sanitizeText('DaMn it')).toBe('**** it');
    });

    test('should handle partial matches correctly (word boundaries)', () => {
        // "class" contains "ass" but should not be flagged
        expect(hasProfanity('class')).toBe(false);
        expect(sanitizeText('class')).toBe('class');
    });

    test('should detect profanity with leet-speak (e.g., $hit, @ss, f*ck)', () => {
        expect(hasProfanity('what a $hit')).toBe(true);
        expect(sanitizeText('what a $hit')).toBe('what a ****');

        expect(hasProfanity('f*ck off')).toBe(true);
        expect(sanitizeText('f*ck off')).toBe('**** off');

        expect(hasProfanity('b!tch')).toBe(true);
        expect(sanitizeText('b!tch')).toBe('*****');

        expect(hasProfanity('@ss')).toBe(true);
        expect(sanitizeText('@ss')).toBe('***');
    });

    test('should detect profanity surrounded by characters', () => {
        expect(hasProfanity('~shit~')).toBe(true);
        expect(sanitizeText('~shit~')).toBe('~****~');

        expect(hasProfanity('!fuck!')).toBe(true);
        expect(sanitizeText('!fuck!')).toBe('!****!');

        expect(hasProfanity('_ass_')).toBe(true);
        expect(sanitizeText('_ass_')).toBe('_***_');
    });

    test('should detect profanity with spaces between characters', () => {
        expect(hasProfanity('s h i t')).toBe(true);
        expect(sanitizeText('s h i t')).toBe('*******'); // length 7

        expect(hasProfanity('f u c k')).toBe(true);
        expect(sanitizeText('f u c k')).toBe('*******');
    });

    test('normalizes full-width, accented, and mixed-script evasion', () => {
        expect(sanitizeText('ｆｕｃｋ')).toBe('****');
        expect(sanitizeText('shít')).toBe('****');
        expect(sanitizeText('fυck')).toBe('****');
        expect(sanitizeText('s\u200bh\u200bi\u200bt')).toBe('*******');
    });

    test('blocks hateful slurs while preserving unrelated words', () => {
        expect(hasProfanity('nigga')).toBe(true);
        expect(hasProfanity('faggot')).toBe(true);
        expect(sanitizeText('nigga')).toBe('*****');
        expect(hasProfanity('classroom assistant')).toBe(false);
        expect(hasProfanity('Dickson County')).toBe(false);
    });
});
