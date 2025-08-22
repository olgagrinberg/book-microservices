package com.bookstore.service;

import java.io.*;
import java.util.function.IntPredicate;

public class CommandRunner {
    public static String askAi(String input) {
        String newline = null;
        try {
            // Command to execute
            String command = "powershell.exe ollama run tinyllama:latest";
            Process process = new ProcessBuilder(command.split(" ")).redirectErrorStream(true).start();
            writeToProcess(process, input);
            newline = stripAnsi(readFromProcess(process));
            System.out.println(newline);

            // Wait for the process to finish
            int exitCode = process.waitFor();
            System.out.println("Exited with code: " + exitCode);

        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
        return newline;
    }

    public static String stripAnsi(String input) {
        return input.replaceAll("\\u001B\\[\\?25l", "")
                .replaceAll("\\u001B\\[\\?25h", "")
                .replaceAll("\\u001B\\[\\?2026l", "")
                .replaceAll("\\u001B\\[\\?2026h", "")
                .replaceAll("\\u001B\\[1G", "")
                .replaceAll("\\u001B\\[K", "")
                .replaceAll("\\u001B\\[2K", "");
    }

    private static void writeToProcess(Process process, String input) throws IOException {
        try (BufferedWriter writer = new BufferedWriter(
                new OutputStreamWriter(process.getOutputStream()))) {
            writer.write(input);
        }
    }

    private static String readFromProcess(Process process) throws IOException {
        var response = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {

            String line;
            IntPredicate cIsBraille = c -> c >= 0x2800 && c <= 0x28FF;

            while ((line = reader.readLine()) != null) {
                response.append(line.codePoints().anyMatch(cIsBraille.negate()) ?
                        line.chars()
                                .filter(cIsBraille.negate())
                                .collect(StringBuilder::new,
                                        StringBuilder::appendCodePoint,
                                        StringBuilder::append)
                                .toString() : line);
            }
        }
        return response.toString();
    }
}
