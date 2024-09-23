#include "main.h"
#include <cstring>
#include <cstdint>
extern "C"
{
    uint8_t *process_keys(const uint8_t *file_id, const uint8_t *obfuscated_key)
    {
        static uint8_t bound_key[16];
        char decrypted_key[16];

        decrypt_main(obfuscated_key, (uint8_t *)decrypted_key);

        bind_key((const uint8_t *)decrypted_key, file_id, bound_key);

        return bound_key;
    }
}
