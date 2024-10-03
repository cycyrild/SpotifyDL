#include <cstring>
#include <cstdint>
#include <unplayplay.hpp>

extern "C"
{
    uint8_t *process_keys(const uint8_t *fileId, const uint8_t *obfuscatedKey)
    {
        unplayplay::FileId fileIdBuffer(fileId, unplayplay::detail::kFileIdSize);
        unplayplay::Key obfuscatedKeyBuffer(obfuscatedKey, unplayplay::detail::kKeySize);

        const unplayplay::Key boundKeyBuffer = unplayplay::decrypt_and_bind_key(obfuscatedKeyBuffer, fileIdBuffer);

        return const_cast<uint8_t *>(boundKeyBuffer.data());
    }
}
